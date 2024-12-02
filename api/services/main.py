from collections import defaultdict
import ssl
from typing import TypedDict
from pymongo import MongoClient
import certifi
from redis_client import save, get, clear
from dotenv import load_dotenv
import json
import os
import requests
import services.sleeper as Sleeper

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')
cert = ssl.create_default_context(cafile=certifi.where())
mongo_user = os.getenv('MONGO_USER')
mongo_pass = os.getenv('MONGO_PASSWORD')
mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
db = mdb['nfl']

def clear_redis() -> None:
    clear()

def init() -> bool:
    try:
        nfl_state = get_nfl_state()
        league_info = get_league_info()
        league_users = get_league_users()
        league_rosters = get_league_rosters()
        league_matchups = get_league_matchups(nfl_state['week'])

        return {
            'nfl_state': nfl_state,
            'league_info': league_info,
            'league_users': league_users,
            'league_rosters': league_rosters,
            'league_matchups': league_matchups[f'{nfl_state["week"]}']
        }
    except Exception as e:
        print(str(e))
        return False

def get_nfl_state():
    nfl_state = get('nfl_state')
    if not nfl_state:
        print('fetching nfl state')
        nfl_state = Sleeper.get_nfl_state()
        save('nfl_state', json.dumps(nfl_state), (60*10))
    else:
        print('found nfl state in redis')
        nfl_state = json.loads(nfl_state)
    
    return nfl_state

def get_league_info():
    league_info = get(f'{LEAGUE_ID}_info')
    if not league_info:
        print('fetching league info')
        league_info = Sleeper.get_league_info(LEAGUE_ID)
        save(f'{LEAGUE_ID}_info', json.dumps(league_info), (60*10))
    else:
        print('found league info in redis')
        league_info = json.loads(league_info)

    return league_info

def get_league_users():
    league_users_by_id = get(f'{LEAGUE_ID}_users')
    if not league_users_by_id:
        print('fetching league users')
        league_users = Sleeper.get_league_users(LEAGUE_ID)
        league_users_by_id = {user['user_id']: user for user in league_users}
        save(f'{LEAGUE_ID}_users', json.dumps(league_users_by_id), (60*10))
    else:
        print('found league users in redis')
        league_users_by_id = json.loads(league_users_by_id)

    return league_users_by_id

def get_league_rosters():
    league_rosters_by_id = get(f'{LEAGUE_ID}_rosters')
    if not league_rosters_by_id:
        print('fetching league rosters')
        league_rosters = Sleeper.get_league_rosters(LEAGUE_ID)
        league_rosters_by_id = {roster['roster_id']: roster for roster in league_rosters}
        save(f'{LEAGUE_ID}_rosters', json.dumps(league_rosters_by_id), (60*10))
    else:
        print('found league rosters in redis')
        league_rosters_by_id = json.loads(league_rosters_by_id)

    return league_rosters_by_id

def get_league_matchups(end_week: int):
    league_matchups_by_week = get(f'{LEAGUE_ID}_matchups')
    if not league_matchups_by_week:
        print('fetching league matchups')
        league_matchups_by_week = {}
        for w in range(1, end_week+1):
            week_matchups = Sleeper.get_league_matchups_for_week(LEAGUE_ID, w)
            matchups_by_id = defaultdict(dict)
            for m in week_matchups:
                matchups_by_id[m['matchup_id']][m['roster_id']] = m

            league_matchups_by_week[w] = matchups_by_id

        save(f'{LEAGUE_ID}_matchups', json.dumps(league_matchups_by_week), (60*10))
    else:
        print('found league matchups in redis')
        league_matchups_by_week = json.loads(league_matchups_by_week)
    
    return league_matchups_by_week

def get_league_transactions(end_week: int):
    league_transactions_by_team = get(f'{LEAGUE_ID}_transactions')
    if not league_transactions_by_team:
        print('fetching league transactions')
        league_transactions_by_team = defaultdict(dict)
        for w in range(1, end_week):
            week_transactions = Sleeper.get_league_transactions_for_week(LEAGUE_ID, w)
            for t in week_transactions:
                if t['status'] == 'complete':
                    for r in t['roster_ids']:
                        num_transactions = league_transactions_by_team.get(r, {}).get(t['type'], 0)
                        league_transactions_by_team[r][t['type']] = num_transactions + 1
        save(f'{LEAGUE_ID}_transactions', json.dumps(league_transactions_by_team), (60*10))
    else:
        print('found league transactions in redis')
        league_transactions_by_team = json.loads(league_transactions_by_team)
    return league_transactions_by_team

def get_current_standings():
    rosters = get(f'{LEAGUE_ID}_rosters')
    if not rosters:
        rosters = get_league_rosters()
    else:
        rosters = json.loads(rosters)

    return [roster[1] for roster in sorted(rosters.items(), key=lambda roster: (roster[1]['settings']['wins'], -roster[1]['settings']['losses'], roster[1]['settings']['ties'], roster[1]['settings']['fpts'], roster[1]['settings']['fpts_decimal']), reverse=True)]
    
def get_per_week_points():
    nfl_state = get_nfl_state()
    league_info = get_league_info()
    matchups = get_league_matchups(nfl_state['week'])

    by_roster = defaultdict(dict)
    for w, matches in matchups.items():
        for m, rosters in matches.items():
            for r, roster in rosters.items():
                prev_points = by_roster.get(r, {}).get(str(int(w)-1), {}).get('points_scored_accum', 0)
                total_points = round(roster['points'] + prev_points, 2)
                by_roster[r][w] = {}
                by_roster[r][w]['points_scored'] = roster['points']
                by_roster[r][w]['points_scored_accum'] = total_points
                collection = db['rosters_weekly_max']
                by_roster[r][w]['max_points'] = collection.find_one({'week': str(w), 'roster_id': int(r), 'matchup_id': str(m), 'league_id': str(league_info['league_id'])})['max_points']

    return by_roster

def get_teams_transactions_count():
    nfl_state = get_nfl_state()
    return get_league_transactions(nfl_state['week'])

def get_player(player_id):
    collection = db['players']

    return collection.find_one({'player_id': player_id}, {'_id': 0})

def get_per_week_standings():

    return {}
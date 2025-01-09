import boto3
from botocore.exceptions import ClientError
from collections import defaultdict
import ssl
from typing import TypedDict
from pymongo import MongoClient
import certifi
from redis_client import ping, save, get, clear
from dotenv import load_dotenv
import json
import os
import requests
import services.sleeper as Sleeper

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')
cert = ssl.create_default_context(cafile=certifi.where())
mongo_user = json.loads(os.getenv('MONGO_CREDENTIALS'))['MONGO_USER']
mongo_pass = json.loads(os.getenv('MONGO_CREDENTIALS'))['MONGO_PASSWORD']

mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
db = mdb['nfl']

# def ping_redis():
#     ping_result = ping()
#     print(f'ping status: {ping_result["status"]}')
#     print(f'ping message: {ping_result["message"]}')
#     return ping_result

# def clear_redis() -> None:
#     clear()

def init() -> bool:
    try:
        nfl_state = get_nfl_state()
        league_info = get_league_info()
        league_users = get_league_users()
        league_rosters = get_league_rosters()
        # league_matchups = get_league_matchups(nfl_state['week'])
        # league_matchups = get_league_matchups(league_info['settings']['playoff_week_start'])

        return {
            'nfl_state': nfl_state,
            'league_info': league_info,
            'league_users': league_users,
            'league_rosters': league_rosters
            # 'league_matchups': league_matchups[nfl_state['week']]
            # 'league_matchups': league_matchups[league_info["settings"]["playoff_week_start"]-1]
        }
    except Exception as e:
        print(e)
        return False

def get_nfl_state():
    nfl_state = Sleeper.get_nfl_state()
    
    return nfl_state

def fetch_sleeper_players():
    nfl_players = Sleeper.get_nfl_players()

    return nfl_players

def get_league_info(league_id: str = LEAGUE_ID):
    league_info = Sleeper.get_league_info(league_id)
    league_info = db['league_info'].find_one({'id': league_id}, {'_id': 0})

    return league_info

def get_league_users(league_id: str = LEAGUE_ID):
    league_users_by_id = db['league_users'].find_one({'id': LEAGUE_ID}, {'_id': 0})['users']

    return league_users_by_id

def get_league_rosters(league_id: str = LEAGUE_ID):
    league_rosters_by_id = db['league_rosters'].find_one({'id': LEAGUE_ID}, {'_id': 0})['rosters']

    return league_rosters_by_id

def get_league_matchups(week: int, league_id: str = LEAGUE_ID):
    league_matchups_by_week = {}
    week_matchups = Sleeper.get_league_matchups_for_week(LEAGUE_ID, week)
    matchups_by_id = defaultdict(dict)
    for m in week_matchups:
        matchups_by_id[m['matchup_id']][m['roster_id']] = m
    league_matchups_by_week[week] = matchups_by_id

    return matchups_by_id

def get_league_transactions(week: int, league_id: str = LEAGUE_ID):
    # league_transactions_by_team = get(f'{LEAGUE_ID}_transactions')
    # if not league_transactions_by_team:
    print('fetching league transactions')
    league_transactions_by_team = defaultdict(dict)
    week_transactions = Sleeper.get_league_transactions_for_week(league_id, week)
    for t in week_transactions:
        if t['status'] == 'complete':
            for r in t['roster_ids']:
                num_transactions = league_transactions_by_team.get(r, {}).get(t['type'], 0)
                league_transactions_by_team[r][t['type']] = num_transactions + 1
    #     save(f'{LEAGUE_ID}_transactions', json.dumps(league_transactions_by_team), (60*10))
    # else:
    #     print('found league transactions in redis')
    #     league_transactions_by_team = json.loads(league_transactions_by_team)
    return week_transactions

def get_current_standings():
    # rosters = get(f'{LEAGUE_ID}_rosters')
    # if not rosters:
    rosters = get_league_rosters()
    # else:
    #     rosters = json.loads(rosters)

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
    weekly_standings = db['weekly_standings'].find_one({'id': LEAGUE_ID}, {'_id': 0})

    return weekly_standings
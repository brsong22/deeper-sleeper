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

def init(year: int, league_id = LEAGUE_ID):
    try:
        nfl_state = get_nfl_state()
        league_info = get_league_info(year, league_id)
        league_users = get_league_users(year, league_id)
        league_rosters = get_league_rosters(year, league_id)
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

def get_players(year: int):
    nfl_players = db['players'].find({'year': str(year)}, {'_id': 0})

    return nfl_players

def get_league_info(year: int, league_id: str = LEAGUE_ID):
    league_info = db['league_info'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})

    return league_info

def get_league_users(year: int, league_id: str = LEAGUE_ID):
    league_users_by_id = db['league_users'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_users_by_id is not None:
        league_users_by_id = league_users_by_id['users']
    
    return league_users_by_id

def get_league_rosters(year: int, league_id: str = LEAGUE_ID):
    league_rosters_by_id = db['league_rosters'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_rosters_by_id is not None:
        league_rosters_by_id = league_rosters_by_id['rosters']

    return league_rosters_by_id

def get_league_matchups(year: int, league_id: str = LEAGUE_ID):
    league_matchups = db['league_matchups'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_matchups is not None:
        league_matchups = league_matchups['matchups']

    return league_matchups

def get_league_transactions(year: int, league_id: str = LEAGUE_ID):
    league_transactions = db['league_transactions'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_transactions is not None:
        league_transactions = league_transactions['transactions']
    
    return league_transactions

def get_league_standings(year: int, league_id: str = LEAGUE_ID):
    league_standings = db['league_standings'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_standings is not None:
        league_standings = league_standings['standings']

    return league_standings

def get_league_state(year: int, league_id: str = LEAGUE_ID):
    rosters = get_league_rosters(year, league_id)

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
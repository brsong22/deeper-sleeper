from services import main, sleeper
from utils import utils
import argparse
from collections import defaultdict
import copy
import certifi
from dotenv import load_dotenv
import json
import os
from pymongo import MongoClient
import redis
import requests
import ssl
import time

#! api > python -m commands.compiles_weekly_sleeper_data
parser = argparse.ArgumentParser()
parser.add_argument('--week', type=int, required=False, default=None, help='Week number to calculate max scores for (omit for all weeks)')
args = parser.parse_args()

redis_client = redis.Redis(host='deepersleeper_redis', port=6379, db=0)

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')
SLEEPER_URL = os.getenv('SLEEPER_BASE_URL')
cert = ssl.create_default_context(cafile=certifi.where())
mongo_user = json.loads(os.getenv('MONGO_CREDENTIALS'))['MONGO_USER']
mongo_pass = json.loads(os.getenv('MONGO_CREDENTIALS'))['MONGO_PASSWORD']
mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
db = mdb['nfl']

def compile_weekly_sleeper_data():
    # update nfl players data
    try:
        players = main.fetch_sleeper_players()
        doc_id = db['players'].insert_many(players.values())
    except Exception as e:
        print(f'Error updating players data: {e}')
    # need to update the current status of the league
    try:
        league_info = sleeper.get_league_info(LEAGUE_ID)
        start_week = league_info['settings']['start_week']
        end_week = league_info['settings']['playoff_week_start']
        # ! upsert here (and probably other places) so we update the existing league info record or insert if not found
        doc_id = db['league_info'].update_one({'id': LEAGUE_ID}, {'$set': {'info': league_info}}, True)
    except Exception as e:
        print(f'Error updating league info: {e}')
    # just need to make sure we have the static info for users such as name and id
    users = db['league_users'].find_one({'id': LEAGUE_ID}, {'_id': 0})
    if users is None:
        try:
            users = utils.convert_keys_to_string({user['user_id']: user for user in sleeper.get_league_users(LEAGUE_ID)})
            doc_id = db['league_users'].insert_one({'id': LEAGUE_ID, 'users': users})
        except Exception as e:
            print(f'Error updating league users data: {e}')
    # just need to make sure we have the static info for rosters such as owner id (we're just going to calculate other stats ourselves for each week)
    rosters = db['league_rosters'].find_one({'id': LEAGUE_ID}, {'_id': 0})
    if rosters is None:
        try:
            rosters = utils.convert_keys_to_string({roster['roster_id']: roster for roster in sleeper.get_league_rosters(LEAGUE_ID)})
            doc_id = db['league_rosters'].insert_one({'id': LEAGUE_ID, 'rosters': rosters})
        except Exception as e:
            print(f'Error updating league rosters data: {e}')
    else:
        rosters = rosters['rosters']
    # get weekly matchups
    matchups_docs = []
    try:
        for week in range(start_week, end_week):
            week_matchups = sleeper.get_league_matchups_for_week(LEAGUE_ID, week)
            matchups_by_id = defaultdict(dict)
            for matchup_team in week_matchups:
                matchups_by_id[matchup_team['matchup_id']][matchup_team['roster_id']] = matchup_team
            matchups_by_id = utils.convert_keys_to_string(matchups_by_id)
            matchups_docs.append({'id': LEAGUE_ID, 'week': str(week), 'matchups': matchups_by_id})
        doc_id = db['league_matchups'].insert_many(matchups_docs)
    except Exception as e:
        print(f'Error updating league matchups data: {e}')
    # get weekly transactions
    transactions_docs = []
    try:
        for week in range(start_week, end_week):
            week_transactions = sleeper.get_league_transactions_for_week(LEAGUE_ID, week)
            transactions_by_team = {}
            for t in week_transactions:
                for r in t['roster_ids']:
                    transactions_for_team = transactions_by_team.get(r, [])
                    transactions_for_team.append(t)
                    transactions_by_team[r] = transactions_for_team
            transactions_by_team = utils.convert_keys_to_string(transactions_by_team)
            transactions_docs.append({'id': LEAGUE_ID, 'week': str(week), 'transactions': transactions_by_team})
        doc_id = db['league_transactions'].insert_many(transactions_docs)
    except Exception as e:
        print(f'Error updating league transactions data: {e}')
    # calculate standings per week
    team_records = {}
    for roster, data in rosters.items():
        team_records[roster] = {
            'record': data['metadata']['record'],
            'wins': data['settings']['wins'],
            'losses': data['settings']['losses'],
            'points': data['settings']['fpts'] + data['settings']['fpts_decimal'] / 100
        }
    weekly_standings = {matchups_docs[-1]['week']: [{roster[0]: roster[1]} for roster in sorted(copy.deepcopy(team_records).items(), key=lambda roster: (roster[1]['wins'], -roster[1]['losses'], roster[1]['points']), reverse=True)]}
    for weekly_matchups in matchups_docs[-1::-1]:
        week = weekly_matchups['week']
        print(f'>> WEEK {week} <<')
        for matchup_teams in weekly_matchups['matchups'].values():
            for team, stats in matchup_teams.items():
                result = team_records[team]['record'][-1]
                team_records[team]['record'] = team_records[team]['record'][:-1]
                team_records[team]['wins'] = team_records[team]['wins'] - 1 if result == 'W' else team_records[team]['wins']
                team_records[team]['losses'] = team_records[team]['losses'] - 1 if result == 'L' else team_records[team]['losses']
                team_records[team]['points'] = round(team_records[team]['points'] - stats['points'], 2)
        weekly_standings[str(int(week)-1)] = [{roster[0]: roster[1]} for roster in sorted(copy.deepcopy(team_records).items(), key=lambda roster: (roster[1]['wins'], -roster[1]['losses'], roster[1]['points']), reverse=True)]

    doc_id = db['weekly_standings'].insert_one({'id': LEAGUE_ID, 'standings': weekly_standings})


    
if __name__ == '__main__':
    start = time.time()

    print(f'compiling sleeper data')
    compile_weekly_sleeper_data()
    
    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
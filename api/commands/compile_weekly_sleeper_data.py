from services import sleeper
from utils import utils
import argparse
from collections import defaultdict
import copy
import certifi
from dotenv import load_dotenv
import json
import os
from pymongo import MongoClient, UpdateOne
import redis
import requests
import ssl
import time

#! api > python -m commands.compiles_weekly_sleeper_data
parser = argparse.ArgumentParser()
parser.add_argument('--week', type=int, required=False, default=None, help='Week number to calculate max scores for (omit for all weeks)')
args = parser.parse_args()

# redis_client = redis.Redis(host='deepersleeper_redis', port=6379, db=0)

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
    nfl_state = sleeper.get_nfl_state()
    year = nfl_state['season']

    # update the current status of the league
    try:
        league_info = sleeper.get_league_info(LEAGUE_ID)
        start_week = league_info['settings']['start_week']
        end_week = league_info['settings']['playoff_week_start']
        doc_id = db['league_info'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'info': league_info}}, upsert=True)
    except Exception as e:
        print(f'Error updating league info: {e}')
    
    # update nfl players data
    try:
        player_docs_upserts = []
        players = sleeper.get_nfl_players()
        for p_id, info in players.items():
            op = UpdateOne({
                        'id': p_id,
                        'year': year
                    },
                    {'$set': {'info': info}},
                    True
            )
            player_docs_upserts.append(op)
        doc_id = db['players'].bulk_write(player_docs_upserts)
    except Exception as e:
        print(f'Error updating players data: {e}')
    
    # update league users
    try:
        users = utils.convert_keys_to_string({user['user_id']: user for user in sleeper.get_league_users(LEAGUE_ID)})
        doc_id = db['league_users'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'users': users}}, upsert=True)
    except Exception as e:
        print(f'Error updating league users data: {e}')

    # update league rosters
    try:
        rosters = utils.convert_keys_to_string({roster['roster_id']: roster for roster in sleeper.get_league_rosters(LEAGUE_ID)})
        doc_id = db['league_rosters'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'rosters': rosters}}, upsert=True)
    except Exception as e:
        print(f'Error updating league rosters data: {e}')
    
    # update weekly matchups of the season
    matchups_by_week = {}
    try:
        for week in range(start_week, end_week):
            week_matchups = sleeper.get_league_matchups_for_week(LEAGUE_ID, week)
            matchups_by_id = defaultdict(dict)
            for matchup_team in week_matchups:
                matchups_by_id[matchup_team['matchup_id']][matchup_team['roster_id']] = matchup_team
            matchups_by_id = utils.convert_keys_to_string(matchups_by_id)
            matchups_by_week[str(week)] = matchups_by_id
        doc_id = db['league_matchups'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'matchups': matchups_by_week}}, upsert=True)
    except Exception as e:
        print(f'Error updating league matchups data: {e}')
    
    # update weekly transactions of the season
    transactions_by_week = {}
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
            transactions_by_week[str(week)] = transactions_by_team
        doc_id = db['league_transactions'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'transactions': transactions_by_week}}, upsert=True)
    except Exception as e:
        print(f'Error updating league transactions data: {e}')
    
    # update weekly standings for the season
    team_records = {}
    try:
        for roster, data in rosters.items():
            team_records[roster] = {
                'record': data['metadata']['record'],
                'wins': data['settings']['wins'],
                'losses': data['settings']['losses'],
                'points': data['settings']['fpts'] + data['settings']['fpts_decimal'] / 100
            }
        weekly_matchups_array = list(matchups_by_week.items())
        weekly_standings = {weekly_matchups_array[-1][0]: [{roster[0]: roster[1]} for roster in sorted(copy.deepcopy(team_records).items(), key=lambda roster: (roster[1]['wins'], -roster[1]['losses'], roster[1]['points']), reverse=True)]}
        for weekly_matchups in weekly_matchups_array[-1::-1]:
            week = weekly_matchups[0]
            for matchup_teams in weekly_matchups[1].values():
                for team, stats in matchup_teams.items():
                    result = team_records[team]['record'][-1]
                    team_records[team]['record'] = team_records[team]['record'][:-1]
                    team_records[team]['wins'] = team_records[team]['wins'] - 1 if result == 'W' else team_records[team]['wins']
                    team_records[team]['losses'] = team_records[team]['losses'] - 1 if result == 'L' else team_records[team]['losses']
                    team_records[team]['points'] = round(team_records[team]['points'] - stats['points'], 2)
            weekly_standings[str(int(week)-1)] = [{roster[0]: roster[1]} for roster in sorted(copy.deepcopy(team_records).items(), key=lambda roster: (roster[1]['wins'], -roster[1]['losses'], roster[1]['points']), reverse=True)]

        doc_id = db['league_standings'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'standings': weekly_standings}}, upsert=True)
    except Exception as e:
        print(f'Error updating league standings data: {e}')

    
if __name__ == '__main__':
    start = time.time()

    print(f'compiling sleeper data')
    compile_weekly_sleeper_data()
    
    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
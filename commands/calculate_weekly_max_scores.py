from collections import defaultdict
import certifi
from dotenv import load_dotenv
import json
import os
from pymongo import MongoClient
import redis
import requests
import ssl
import time

#! python ./commands/calculate_weekly_max_scores.py

redis_client = redis.Redis(host='deepersleeper_redis', port=6379, db=0)

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')
SLEEPER_URL = os.getenv('SLEEPER_BASE_URL')
cert = ssl.create_default_context(cafile=certifi.where())
mongo_user = os.getenv('MONGO_USER')
mongo_pass = os.getenv('MONGO_PASSWORD')
mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
db = mdb['nfl']

def calculate_weekly_max_scores():
    nfl_state = get_nfl_state()
    league_info = get_league_info()
    league_matchups = get_league_matchups(nfl_state['week'])
    
    rosters_max_points = []
    for w, matches in league_matchups.items():
        print(f'>>> week {w} <<<')
        for m, rosters in matches.items():
            for r, roster in rosters.items():
                active_roster_positions = [position for position in league_info['roster_positions'] if position != 'BN']

                print(f'> roster_id: {roster["roster_id"]}')
                players_data = {
                    key: {'points': value} for key, value in roster['players_points'].items()
                }
                for id in players_data.keys():
                    player_info = get_player(id)
                    player_positions = player_info['fantasy_positions']
                    players_data[id]['positions'] = player_positions
                
                sorted_players_by_score = dict(
                    sorted(players_data.items(), key=lambda item: item[1]['points'], reverse=True)
                )

                max_points = 0
                for id, player in sorted_players_by_score.items():
                    player_positions = player['positions']

                    # greedy - this potentially won't calculate correctly when there are players eligible for multiple positions
                    for position in player_positions:
                        if position in active_roster_positions:
                            max_points = round(max_points + player['points'], 2)
                            active_roster_positions.remove(position)
                            continue
                        # quarter backs and kickers cannot go in flex
                        # this is probably a league setting we can dynamically check to be more flexible
                        if 'FLEX' in active_roster_positions and position not in ['QB', 'K']:
                            max_points = round(max_points + player['points'], 2)
                            active_roster_positions.remove('FLEX')
                
                rosters_max_points.append({
                    'week': str(w),
                    'matchup_id': str(m),
                    'league_id': str(league_info['league_id']),
                    'roster_id': str(roster['roster_id']),
                    'players': roster['players'],
                    'players_scores': roster['players_points'],
                    'max_points': max_points
                })

                print(f'max points: {max_points}')

    collection = db['rosters_weekly_max']
    collection.delete_many({})

    try:
        doc_ids = collection.insert_many(rosters_max_points)
        print(f'rosters max points saved! ({len(doc_ids.inserted_ids)})')
    except Exception as e:
        print(f'Error saving rosters max points data to db: {e}')
    
    mdb.close()


def get_nfl_state():
    nfl_state = redis_client.get('nfl_state')
    if not nfl_state:
        print('fetching nfl state')
        nfl_state = requests.get(f'{SLEEPER_URL}/state/nfl').json()
        redis_client.set('nfl_state', json.dumps(nfl_state), (60*10))
    else:
        print('found nfl state in redis')
        nfl_state = json.loads(nfl_state)
    
    return nfl_state

def get_league_info():
    league_info = redis_client.get(f'{LEAGUE_ID}_info')
    if not league_info:
        print('fetching league info')
        league_info = requests.get(f'{SLEEPER_URL}/league/{LEAGUE_ID}').json()
        redis_client.set(f'{LEAGUE_ID}_info', json.dumps(league_info), (60*10))
    else:
        print('found league info in redis')
        league_info = json.loads(league_info)

    return league_info

def get_league_matchups(end_week: int):
    league_matchups_by_week = redis_client.get(f'{LEAGUE_ID}_matchups')
    if not league_matchups_by_week:
        print('fetching league matchups')
        league_matchups_by_week = {}
        for w in range(1, end_week+1):
            week_matchups = requests.get(f'{os.getenv("SLEEPER_BASE_URL")}/league/{LEAGUE_ID}/matchups/{w}').json()
            matchups_by_id = defaultdict(dict)
            for m in week_matchups:
                matchups_by_id[m['matchup_id']][m['roster_id']] = m

            league_matchups_by_week[w] = matchups_by_id

        redis_client.set(f'{LEAGUE_ID}_matchups', json.dumps(league_matchups_by_week), (60*10))
    else:
        print('found league matchups in redis')
        league_matchups_by_week = json.loads(league_matchups_by_week)
    
    return league_matchups_by_week

def get_player(player_id):
    collection = db.players

    return collection.find_one({'player_id': player_id}, {'_id': 0})


if __name__ == '__main__':
    start = time.time()

    calculate_weekly_max_scores()
    
    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
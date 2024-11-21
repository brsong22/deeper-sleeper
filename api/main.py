import certifi
from collections import defaultdict
from dotenv import load_dotenv
from fastapi import FastAPI
import json
from pymongo import MongoClient
import os
import requests
import ssl

app = FastAPI()
load_dotenv()

@app.get('/')
async def root():
    return {'message': 'Hello World'}

@app.get('/league/{league_id}')
async def get_league(league_id):
    url = f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}'

    data = requests.get(url)

    return data.json()

@app.get('/league/{league_id}/users')
async def get_league_users(league_id):
    url = f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}/users'

    data = requests.get(url)

    return data.json()

@app.get('/league/{league_id}/rosters')
async def get_league_rosters(league_id):
    url = f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}/rosters'

    data = requests.get(url)

    return data.json()

@app.get('/players/{sport}')
async def get_players(sport):
    cert = ssl.create_default_context(cafile=certifi.where())
    mongo_user = os.getenv('MONGO_USER')
    mongo_pass = os.getenv('MONGO_PASSWORD')
    mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
    mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
    db = mdb[sport]
    collection = db.players

    return list(collection.find({}, {'_id': 0}))

@app.get('/league/{league_id}/matchups/{week}')
async def get_league_matchups_for_week(league_id, week):
    league_data = requests.get(f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}').json()
    
    cert = ssl.create_default_context(cafile=certifi.where())
    mongo_user = os.getenv('MONGO_USER')
    mongo_pass = os.getenv('MONGO_PASSWORD')
    mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
    mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
    db = mdb[league_data['sport']]
    collection = db.players

    users_data = requests.get(f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}/users').json()
    rosters_data = requests.get(f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}/rosters').json()
    matchups_data = requests.get(f'{os.getenv('SLEEPER_BASE_URL')}/league/{league_id}/matchups/{week}').json()

    users = {}
    for user in users_data:
        users[user['user_id']] = user
    
    rosters = {}
    for roster in rosters_data:
        rosters[roster['roster_id']] = roster

    matchups = defaultdict(list)
    for matchup in matchups_data:
        matchup_dict = matchup
        matchup_dict['owner_name'] = users[rosters[matchup['roster_id']]['owner_id']]['display_name']
        
        # query 1:1 because the result is not guaranteed to preserve order if querying all at once
        matchup_dict['players_names'] = []
        for player_id in matchup_dict['players']:
            player_id_query = {'player_id': player_id}
            player = collection.find_one(player_id_query)
            matchup_dict['players_names'].append(player['full_name'])
        
        matchups[matchup['matchup_id']].append(matchup_dict)
    mdb.close()

    return matchups

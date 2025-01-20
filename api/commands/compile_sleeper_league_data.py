from services import sleeper
import argparse
import copy
import certifi
from dotenv import load_dotenv
import json
import os
from pymongo import MongoClient, UpdateOne
import ssl
import time
from commands.compile_league_info_data import compile_league_info
from commands.compile_nfl_players_data import compile_nfl_players
from commands.compile_league_users_data import compile_league_users
from commands.compile_league_rosters_data import compile_league_rosters
from commands.compile_league_matchups_data import compile_league_matchups
from commands.compile_league_transactions_data import compile_league_transactions
from commands.compile_league_standings_data import compile_league_standings
from commands.compile_league_drafts_data import compile_league_drafts
#! api > python -m commands.compiles_weekly_sleeper_data

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
parser.add_argument('--players', action='store_true', help='include flag to update players data')
args = parser.parse_args()

def compile_weekly_sleeper_data(update_players: bool, league_id: str = LEAGUE_ID):
    nfl_state = sleeper.get_nfl_state()
    year = nfl_state['season']

    # update the current status of the league
    try:
        info = compile_league_info(LEAGUE_ID)
        year = info['league_info']['season']
        if (update_players):
            compile_nfl_players(year)
        compile_league_users(year, LEAGUE_ID)
        rosters = compile_league_rosters(year, LEAGUE_ID)
        start_week = info['league_info']['settings']['start_week']
        end_week = info['league_info']['settings']['playoff_week_start']
        matchups = compile_league_matchups(start_week, end_week, year, LEAGUE_ID)
        compile_league_transactions(start_week, end_week, year, LEAGUE_ID)
        compile_league_standings(matchups['matchups'], rosters['rosters'], year, LEAGUE_ID)
        compile_league_drafts(LEAGUE_ID)
    except Exception as e:
        print(f'Error compiling data: {e}')
    
if __name__ == '__main__':
    start = time.time()

    print(f'compiling sleeper league data')
    compile_weekly_sleeper_data(args.players, args.league)
    
    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
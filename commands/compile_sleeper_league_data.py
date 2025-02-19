from api.services import sleeper
import argparse
import copy
import certifi
from api.utils.utils import get_env
import json
import os
from pymongo import MongoClient, UpdateOne
import ssl
import time
from commands.league.compile_league_info_data import compile_league_info
from commands.players.compile_nfl_players_data import compile_nfl_players
from commands.users.compile_league_users_data import compile_league_users
from commands.rosters.compile_league_rosters_data import compile_league_rosters
from commands.matchups.compile_league_matchups_data import compile_league_matchups
from commands.transactions.compile_league_transactions_data import compile_league_transactions
from commands.standings.compile_league_standings_data import compile_league_standings
from commands.drafts.compile_league_drafts_data import compile_league_drafts
from commands.points.compile_league_max_points_data import compile_league_max_points
from commands.playoffs.compile_league_playoffs_bracket_data import compile_league_playoff_bracket
#! > python -m commands.compile_weekly_sleeper_data

get_env()
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
        print('league info...')
        info = compile_league_info(league_id)
        year = info['league_info']['season']
        if (update_players):
            print('nfl players...')
            compile_nfl_players(year)
        print('league users...')
        compile_league_users(year, league_id)
        print('league rosters...')
        rosters = compile_league_rosters(year, league_id)
        start_week = info['league_info']['settings']['start_week']
        end_week = info['league_info']['settings']['playoff_week_start']
        print('league matchups...')
        matchups = compile_league_matchups(start_week, end_week, year, league_id)
        print('league transactions...')
        compile_league_transactions(start_week, end_week, year, league_id)
        print('league standings...')
        compile_league_standings(matchups['matchups'], rosters['rosters'], year, league_id)
        print('league max points...')
        compile_league_max_points(matchups['matchups'], rosters['rosters'], info['league_info'], league_id)
        print('league drafts...')
        compile_league_drafts(league_id)
        print('league playoffs brackets...')
        compile_league_playoff_bracket(year, league_id)
    except Exception as e:
        print(f'Error compiling data: {e}')
    
if __name__ == '__main__':
    start = time.time()

    print(f'compiling sleeper league data')
    compile_weekly_sleeper_data(args.players, args.league)
    
    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
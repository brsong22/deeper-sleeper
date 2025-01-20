import argparse
from services import sleeper, main
import copy
from dotenv import load_dotenv
import os
import time
from mongodb_client import get_db

db = get_db()
load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
args = parser.parse_args()

def compile_league_standings(matchups_by_week: dict, rosters: dict, year: str, league_id: str = LEAGUE_ID):
    try:
        team_records = {}
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
        doc_id = db['league_standings'].update_one({'league_id': league_id, 'year': year}, {'$set': {'standings': weekly_standings}}, upsert=True)
    except Exception as e:
        raise Exception(f'Error updating league standings data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league standings data]')
    league_info = sleeper.get_league_info(args.league)
    matchups = main.get_league_matchups(league_info['season'], args.league)
    rosters = main.get_league_rosters(league_info['season'], args.league)

    if matchups is None:
        raise Exception(f'Error updating league standings data. Requires matchups data.')
    elif rosters is None:
        raise Exception(f'Error updating league standgins data. Requires rosters data.')
    else:
        compile_league_standings(matchups, rosters, league_info['season'], args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
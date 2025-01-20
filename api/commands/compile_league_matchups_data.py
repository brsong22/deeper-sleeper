import argparse
import time
from services import sleeper
from utils import utils
from dotenv import load_dotenv
from mongodb_client import get_db
from collections import defaultdict
import os

db = get_db()
load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
args = parser.parse_args()

def compile_league_matchups(start_week: int, end_week: int, year: str, league_id: str = LEAGUE_ID):
    try:
        matchups_by_week = {}
        for week in range(start_week, end_week):
            week_matchups = sleeper.get_league_matchups_for_week(league_id, week)
            matchups_by_id = defaultdict(dict)
            for matchup_team in week_matchups:
                matchups_by_id[matchup_team['matchup_id']][matchup_team['roster_id']] = matchup_team
            matchups_by_id = utils.convert_keys_to_string(matchups_by_id)
            matchups_by_week[str(week)] = matchups_by_id
        doc_id = db['league_matchups'].update_one({'league_id': league_id, 'year': year}, {'$set': {'matchups': matchups_by_week}}, upsert=True)
        return {
            'doc_id': doc_id,
            'matchups': matchups_by_week
        }
    except Exception as e:
        raise Exception(f'Error updating league matchups data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league matchups data]')
    league_info = sleeper.get_league_info(args.league)

    compile_league_matchups(league_info['settings']['start_week'], league_info['settings']['playoff_week_start'], league_info['season'], args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
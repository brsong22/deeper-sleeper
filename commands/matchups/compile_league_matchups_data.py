import argparse
import datetime
import time
from api.services import sleeper
from api.utils import utils
from api.utils.utils import get_env
from api.mongodb_client import get_db
from collections import defaultdict
import os

db = get_db()
get_env()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=True, help='league id')
args = parser.parse_args()

def compile_league_matchups(start_week: int, end_week: int, year: str, league_id: str):
    try:
        matchups_by_week = {}
        for week in range(start_week, end_week):
            week_matchups = sleeper.get_league_matchups_for_week(league_id, week)
            matchups_by_id = defaultdict(dict)
            for matchup_team in week_matchups:
                matchup_id = matchup_team['matchup_id'] if matchup_team['matchup_id'] else 'none'
                matchups_by_id[matchup_id][matchup_team['roster_id']] = matchup_team
            matchups_by_id = utils.convert_keys_to_string(matchups_by_id)
            matchups_by_week[str(week)] = matchups_by_id
        doc_id = db['league_matchups'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'matchups': matchups_by_week, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
            },
            upsert=True
        )
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
    end_week = league_info['settings']['playoff_week_start'] + league_info['settings']['draft_rounds']

    compile_league_matchups(league_info['settings']['start_week'], end_week, league_info['season'], args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
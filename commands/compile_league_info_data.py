import argparse
import datetime
from api.services import sleeper
from api.utils.utils import get_env
from api.mongodb_client import get_db
import os
import time

db = get_db()
get_env()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
# shouldn't actually accept years because sleeper only provides the current year's data
# parser.add_argument('--years', nargs='*', type=int, required=False, default=[], hint='years to compile league info for')
args = parser.parse_args()

def compile_league_info(league_id: str = LEAGUE_ID):
    try:
        league_info = sleeper.get_league_info(league_id)
        doc_id = db['league_info'].update_one(
            {
                'league_id': league_id,
                'year': league_info['season']
            },
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'league': league_info}
            },
            upsert=True
        )
        return {
            'doc_id': doc_id,
            'league_info': league_info
        }
    except Exception as e:
        raise Exception(f'Error updating league info: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league info data]')
    compile_league_info(args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
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
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
args = parser.parse_args()

def compile_league_playoff_bracket(year: str, league_id: str = LEAGUE_ID):
    try:
        playoff_brackets = sleeper.get_league_playoffs_bracket(league_id)
        doc_id = db['league_playoff_brackets'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'brackets': playoff_brackets, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
            },
            upsert=True
        )
        return {
            'doc_id': doc_id,
            'brackets': playoff_brackets
        }
    except Exception as e:
        raise Exception(f'Error updating league playoff brackets data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league playoffs bracket data]')
    league_info = sleeper.get_league_info(args.league)

    compile_league_playoff_bracket(league_info['season'], args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
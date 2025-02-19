import argparse
import datetime
import time
from api.utils import utils
from api.services import sleeper
from api.utils.utils import get_env
from api.mongodb_client import get_db
import os

db = get_db()
get_env()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=True, help='league id')
args = parser.parse_args()

def compile_league_rosters(year: str, league_id: str):
    try:
        rosters = utils.convert_keys_to_string({roster['roster_id']: roster for roster in sleeper.get_league_rosters(league_id)})
        doc_id = db['league_rosters'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'rosters': rosters, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
            },
            upsert=True
        )
        return {
            'doc_id': doc_id,
            'rosters': rosters
        }
    except Exception as e:
        raise Exception(f'Error updating league rosters data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league rosters data]')
    league_info = sleeper.get_league_info(args.league)
    compile_league_rosters(league_info['season'], args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
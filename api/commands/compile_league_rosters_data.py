import argparse
import time
from utils import utils
from services import sleeper
from dotenv import load_dotenv
from mongodb_client import get_db
import os

db = get_db()
load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
args = parser.parse_args()

def compile_league_rosters(year: str, league_id: str = LEAGUE_ID):
    try:
        rosters = utils.convert_keys_to_string({roster['roster_id']: roster for roster in sleeper.get_league_rosters(league_id)})
        doc_id = db['league_rosters'].update_one({'league_id': LEAGUE_ID, 'year': year}, {'$set': {'rosters': rosters}}, upsert=True)
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
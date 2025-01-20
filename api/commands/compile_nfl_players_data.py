import argparse
import time
from services import sleeper
from dotenv import load_dotenv
from pymongo import UpdateOne
from mongodb_client import get_db
import os

db = get_db()
load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='league id')
args = parser.parse_args()

def compile_nfl_players(year: str):
    try:
        player_docs_upserts = []
        players = sleeper.get_nfl_players()
        for p_id, info in players.items():
            op = UpdateOne({
                        'id': p_id,
                        'year': year
                    },
                    {'$set': {'player': info}},
                    True
            )
            player_docs_upserts.append(op)
        doc_id = db['players'].bulk_write(player_docs_upserts)
    except Exception as e:
        raise Exception(f'Error updating players data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [nfl players data]')
    league_info = sleeper.get_league_info(args.league)
    compile_nfl_players(league_info['season'])

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
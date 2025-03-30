import argparse
import datetime
import time
from api.services import sleeper
from api.utils import utils
from api.mongodb_client import get_db

db = get_db()

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=True, help='league id')
args = parser.parse_args()

def compile_league_transactions(start_week: int, end_week: int, year: str, league_id: str):
    try:
        transactions_by_week = {}
        for week in range(start_week, end_week):
            week_transactions = sleeper.get_league_transactions_for_week(league_id, week)
            transactions_by_team = {}
            for t in week_transactions:
                for r in t['roster_ids']:
                    transactions_for_team = transactions_by_team.get(r, [])
                    transactions_for_team.append(t)
                    transactions_by_team[r] = transactions_for_team
            transactions_by_team = utils.convert_keys_to_string(transactions_by_team)
            transactions_by_week[str(week)] = transactions_by_team
        doc_id = db['league_transactions'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'transactions': transactions_by_week, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
            },
            upsert=True
        )
    except Exception as e:
        raise Exception(f'Error updating league transactions data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league transactions data]')
    league_info = sleeper.get_league_info(args.league)
    end_week = league_info['settings']['playoff_week_start'] + league_info['settings']['draft_rounds']

    compile_league_transactions(league_info['settings']['start_week'], end_week, league_info['season'], args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
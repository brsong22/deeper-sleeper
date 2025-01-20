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
parser.add_argument('--league', type=str, required=False, default=LEAGUE_ID, help='sleeper league id')
args = parser.parse_args()

def compile_league_drafts(league_id: str = LEAGUE_ID):
    try:
        drafts = sleeper.get_league_drafts(league_id)
        draft_docs_ops = []
        draft_pick_docs_ops = []
        for draft in drafts:
            op = UpdateOne({
                    'league_id': draft['league_id'],
                    'draft_id': draft['draft_id'],
                    'year': draft['season']
                },
                {'$set': {'draft': draft}},
                True
            )
            draft_docs_ops.append(op)

            draft_picks = sleeper.get_draft_picks(draft['draft_id'])
            for pick in draft_picks:
                op = UpdateOne({
                        'league_id': draft['league_id'],
                        'draft_id': pick['draft_id'],
                        'pick_no': pick['pick_no']
                    },
                    {'$set': {'roster_id': pick['roster_id'], 'pick': pick}},
                    True
                )
                draft_pick_docs_ops.append(op)
        draft_doc_ids = db['league_drafts'].bulk_write(draft_docs_ops)
        draft_pick_doc_ids = db['league_draft_picks'].bulk_write(draft_pick_docs_ops)
    except Exception as e:
        raise Exception(f'Error updating league draft data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league drafts data]')
    league_info = sleeper.get_league_info(args.league)
    compile_league_drafts(args.league)
    
    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
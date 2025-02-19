import argparse
import datetime
import re
import time
import csv
from pymongo import UpdateOne
from api.utils.utils import get_env
from api.mongodb_client import get_db
import os

db = get_db()
parser = argparse.ArgumentParser()
parser.add_argument('--year', type=str, required=True, help='projections year')
parser.add_argument('--scoring', type=str, default='ppr', help='scoring type to compile ranking for')
args = parser.parse_args()

def compile_player_adp(year: str, score_type: str):
    try:
        player_ids_csv = 'data/player_ids.csv'
        with open(player_ids_csv, 'r', newline='', encoding='utf-8-sig') as ids_file:
            ids = csv.DictReader(ids_file)
            sleeper_id_by_name = {}
            for row in ids:
                if row['sleeper_name'] in sleeper_id_by_name:
                    sleeper_id_by_name[row['sleeper_name']].append(row['sleeper_id'])
                else:
                    sleeper_id_by_name[row['sleeper_name']] = [row['sleeper_id']]
                # sleeper_id_by_name[row['sleeper_name']] = sleeper_id_by_name.get(row['sleeper_name'], []).append(row['sleeper_id'])
            # sleeper_id_by_name = {row['sleeper_name']: row['sleeper_id'] for row in ids if 'sleeper_id' in row}
        file_path = f'data/adp'
        player_adp_docs = []
        with open(f'{file_path}/{year}_{score_type}_adp.txt', 'r') as rank_file:
            rankings_data = rank_file.read().split(',')
            if rankings_data:
                for adp_ranking in rankings_data:
                    rank, name = adp_ranking.split('_')
                    sleeper_ids = sleeper_id_by_name.get(name, [])
                    if len(sleeper_ids) == 1:
                        player_adp_docs.append(
                            UpdateOne(
                                {
                                    'year': year,
                                    'id': sleeper_ids[0],
                                    'score_type': score_type,
                                    'source': 'beatadp sleeper'
                                },
                                {
                                    '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                                    '$set': {'adp': rank, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
                                },
                                True
                            )
                        )
                    elif len(sleeper_ids) > 1:
                        print(f'{name} has multiple matches {sleeper_ids}')
                    else:
                        print(f'no mapping for [{name}]')
        if player_adp_docs:
            doc_ids = db['player_adps'].bulk_write(player_adp_docs)
    except Exception as e:
        print(f'error compiling player adp data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [player adp data]')
    compile_player_adp(args.year, args.scoring)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
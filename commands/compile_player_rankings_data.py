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

def compile_player_rankings(year: str, score_type: str):
    try:
        player_ids_csv = 'data/player_ids.csv'
        with open(player_ids_csv, 'r', newline='', encoding='utf-8-sig') as ids_file:
            ids = csv.DictReader(ids_file)
            fantasypros_id_dict = {row['fantasypros_id']: row['sleeper_id'] for row in ids if 'fantasypros_id' in row and 'sleeper_id' in row}
            print(f'full mappings: {len(fantasypros_id_dict.keys())} keys')
        file_path = f'data/rankings'
        ranking_files = [f for f in os.listdir(file_path) if re.match(rf'^{year}_\d+_{score_type}_rankings.txt$', f)]
        player_rankings_docs = []
        for file in ranking_files:
            with open(f'{file_path}/{file}', 'r') as rank_file:
                year, week, score_type, *_ = file.split('_')
                rankings_data = rank_file.read().split(',')
                if rankings_data:
                    for ranking in rankings_data:
                        fp_id, rank, name = ranking.split('_')
                        sleeper_id = fantasypros_id_dict.get(fp_id)
                        if sleeper_id:
                            player_rankings_docs.append(
                                UpdateOne(
                                    {
                                        'year': year,
                                        'week': week,
                                        'id': sleeper_id,
                                        'score_type': score_type
                                    },
                                    {
                                        '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                                        '$set': {'rank': rank, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
                                    },
                                    True
                                )
                            )
                        else:
                            print(f'no mapping for [week {week} - {fp_id} - {name}]')
        if player_rankings_docs:
            doc_ids = db['player_rankings'].bulk_write(player_rankings_docs)
    except Exception as e:
        print(f'error compiling player rankings data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [player rankings data]')
    compile_player_rankings(args.year, args.scoring)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
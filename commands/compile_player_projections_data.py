import argparse
import datetime
import time

from pymongo import UpdateMany
from api.utils import utils
from api.services import sleeper
from api.utils.utils import get_env
from api.mongodb_client import get_db
import os

db = get_db()
parser = argparse.ArgumentParser()
parser.add_argument('--year', type=str, required=True, help='projections year')
args = parser.parse_args()

def compile_player_projections(year: str):
    try:
        projections_file_path = f'data/{year}_projections.txt'
        projections_data = []
        id_mappings = {}
        null_id = 0
        multi_match = 0
        no_match = 0
        with open(projections_file_path, 'r') as pf:
            projections_data = pf.read().split(',')
        if projections_data:
            source = projections_data[0]
            year = projections_data[1]
            projection_docs = []
            players_projection_data = projections_data[2::]
            for player in players_projection_data:
                player_data = player.split('_')
                rank = player_data[0]
                source_id = player_data[1]
                name = player_data[2]
                if source_id:
                    player_docs = list(db['players'].aggregate([
                        {
                            '$match': {
                                '$or': [
                                    { f'player.{source}_id': int(source_id) },
                                    { 'player.full_name': name }
                                ]
                            }
                        }
                    ]))
                    if len(set([p['id'] for p in player_docs])) == 1:
                        player = player_docs[0]
                        if not player['player'][f'{source}_id']:
                            null_id += 1
                            print(f'null [{source}_id] for {player['player']['full_name']} ({player['id']}) - matched by full_name')
                            id_mappings[player['id']] = int(source_id)
                        projection_docs.append({
                            'source': source,
                            'source_id': int(source_id),
                            'id': player['id'],
                            'rank': rank,
                            'year': year,
                            'created_at': datetime.datetime.now(datetime.timezone.utc),
                            'updated_at': datetime.datetime.now(datetime.timezone.utc)
                        }) 
                    elif len(player_docs) > 1:
                        multi_match += 1
                        print(f'multiple matches for {name} ({source}_id: {source_id}) {[p['id'] for p in player_docs]}')
                    else:
                        print(f'no match for {source} id [{source_id}] - {name}. trying {name.split(' ')[:2]}')
                        if len(name.split(' ')) > 2:
                            players_projection_data.append(f'{rank}_{source_id}_{" ".join(name.split(' ')[:2])}')
                        else:
                            no_match += 1
            print(id_mappings)
            print(f'null: {null_id} | multi: {multi_match} | none: {no_match}')
            update_with_source_ids = [
                UpdateMany(
                    {'id': sleeper_id},
                    {'$set': {f'player.{source}_id': external_id, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}}
                )
                for sleeper_id, external_id in id_mappings.items()
            ]
            if update_with_source_ids:
                print(f'updating sleeper players with [{source}] ids')
                doc_ids = db['players'].bulk_write(update_with_source_ids)
            print(f'writing player projections data')
            doc_ids = db['player_projections'].insert_many(projection_docs)
    except Exception as e:
        raise Exception(f'Error updating player projections data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [player projections data]')
    compile_player_projections(args.year)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
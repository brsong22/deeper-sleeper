import argparse
import datetime
import time
from pymongo import UpdateMany, UpdateOne
from api.mongodb_client import get_db

db = get_db()
parser = argparse.ArgumentParser()
parser.add_argument('--year', type=str, required=True, help='projections year')
parser.add_argument('--scoring', type=str, default='ppr', help='scoring system')
args = parser.parse_args()

def compile_player_projections(year: str, score_type: str):
    try:
        projections_file_path = f'data/{year}_{score_type}_projections.txt'
        projections_data = []
        id_mappings = {}
        null_id = 0
        multi_match = 0
        no_match = 0
        with open(projections_file_path, 'r') as pf:
            projections_data = pf.read().split(',')
        if projections_data:
            source = projections_data[0]
            score_type = projections_data[1]
            year = projections_data[2]
            projection_docs = []
            players_projection_data = projections_data[3::]
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
                        projection_docs.append(UpdateOne(
                            {
                                'id': player['id'],
                                'year': year,
                                'source': source,
                                'score_type': score_type
                            },
                            {
                                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                                '$set': {
                                    'rank': rank,
                                    'source_id': int(source_id),
                                    'updated_at': datetime.datetime.now(datetime.timezone.utc)
                                }
                            },
                            True
                        ))
                    elif len(player_docs) > 1:
                        matched_by_source_id = False
                        for match in player_docs:
                            if match['player'][f'{source}_id'] == int(source_id):
                                matched_by_source_id = True
                                projection_docs.append(UpdateOne(
                                    {
                                        'id': match['id'],
                                        'year': year,
                                        'source': source,
                                        'score_type': score_type
                                    },
                                    {
                                        '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                                        '$set': {
                                            'rank': rank,
                                            'source_id': int(source_id),
                                            'updated_at': datetime.datetime.now(datetime.timezone.utc)
                                        }
                                    },
                                    True
                                ))
                                break
                        if not matched_by_source_id:
                            multi_match += 1
                            print(f'multiple matches for {name} ({source}_id: {source_id}) {[p['id'] for p in player_docs]}')
                    else:
                        print(f'no match for {source} id [{source_id}] - {name}. trying {name.split(' ')[:2]}')
                        if len(name.split(' ')) > 2:
                            players_projection_data.append(f'{rank}_{source_id}_{" ".join(name.split(' ')[:2])}')
                        else:
                            no_match += 1
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
            if projection_docs:
                doc_ids = db['player_projections'].bulk_write(projection_docs)
    except Exception as e:
        raise Exception(f'Error updating player projections data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [player projections data]')
    compile_player_projections(args.year, args.scoring)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
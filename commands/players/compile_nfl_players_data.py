import argparse
import datetime
import time
from api.services import sleeper
from pymongo import UpdateOne
from api.mongodb_client import get_db

db = get_db()

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=True, help='league id')
args = parser.parse_args()

PLAYER_FIELDS = ['active', 'player_id', 'team', 'first_name', 'last_name', 'full_name', 'fantasy_positions']

def should_record_player_update(sleeper_player: dict, mongo_player: dict):
    try:
        int(sleeper_player['player_id'])
        for field in PLAYER_FIELDS:
            if field == 'fantasy_positions':
                sleeper_positions = sleeper_player[field] if sleeper_player[field] else []
                mongo_positions = mongo_player[field] if mongo_player[field] else []
                if set(sleeper_positions) != set(mongo_positions):
                    print(f'player [{mongo_player['player_id']}] [fantasy_positions] not equal')
                    return True
            elif sleeper_player[field] != mongo_player[field]:
                print(f'player [{mongo_player['player_id']}] [{field}] not equal')
                return True
            
        return False
    except ValueError:
        return False

def compile_nfl_players(year: str, week: int):
    week = 14
    PLAYERS_AGGREGATE = [
        {
            '$group': {
                '_id': {'id': '$id'},
                'max_year': {'$max': '$year'},
                'max_week': {'$max': '$week'}
            }
        },
        {
            '$lookup': {
                'from': 'players',
                'let': {'id': '$_id.id', 'year': '$max_year', 'week': '$max_week'},
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$and': [
                                    {'$eq': ['$id', '$$id']},
                                    {'$eq': ['$year', '$$year']},
                                    {'$eq': ['$week', '$$week']}
                                ]
                            }
                        }
                    }
                ],
                'as': 'player_docs'
            }
        },
        {'$unwind': '$player_docs'},
        {'$replaceRoot': {'newRoot': '$player_docs'}}
    ]
    try:
        player_docs_upserts = []
        fetch_start = time.time()
        players = sleeper.get_nfl_players()
        fetch_end = time.time()
        print(f'fetching players: {fetch_end - fetch_start} seconds')
        aggregate_start = time.time()
        players_docs = list(db['players'].aggregate(PLAYERS_AGGREGATE))
        aggregate_end = time.time()
        print(f'aggregating players: {aggregate_end - aggregate_start} seconds')
        players_dict = {p['id']: p['player'] for p in players_docs}
        compare_start = time.time()
        for p_id, player in players.items():
            if (p_id not in players_dict or 
                should_record_player_update(player, players_dict[p_id])):
                op = UpdateOne({
                        'id': p_id,
                        'year': year,
                        'week': week
                    },
                    {
                        '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                        '$set': {'player': player, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
                    },
                    True
                )
                player_docs_upserts.append(op)
        compare_end = time.time()
        print(f'comparing players data: {compare_end - compare_start} seconds')
        print(f'[{len(player_docs_upserts)}] players data have changed - adding records for week [{week}]')
        if player_docs_upserts:
            doc_id = db['players'].bulk_write(player_docs_upserts)
    except Exception as e:
        raise Exception(f'Error updating players data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [nfl players data]')
    nfl_state = sleeper.get_nfl_state()
    league_info = sleeper.get_league_info(args.league)
    compile_nfl_players(league_info['season'], nfl_state['leg']) # despite 'leg' being defined as regular season in the docs - this increments into post season. do we limit to league_info 'playoff_week_start'?

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
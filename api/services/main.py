from collections import defaultdict
from api.mongodb_client import get_db
from api.utils.utils import get_env
import os
from api.services import sleeper, waivers_service

get_env()
LEAGUE_ID = os.getenv('LEAGUE_ID')

db = get_db()

def init(year: int, league_id = LEAGUE_ID):
    try:
        league_info = get_league_info(year, league_id)
        league_users = get_league_users(year, league_id)
        league_rosters = get_league_rosters(year, league_id)

        return {
            'league_info': league_info,
            'league_users': league_users,
            'league_rosters': league_rosters
        }
    except Exception as e:
        print(e)
        return False

def get_nfl_state():
    nfl_state = sleeper.get_nfl_state()
    
    return nfl_state

def get_players(year: int):
    nfl_players = db['players'].find({'year': str(year)}, {'_id': 0})

    return nfl_players

def get_league_info(year: int, league_id: str = LEAGUE_ID):
    league_info = db['league_info'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})

    return league_info

def get_league_users(year: int, league_id: str = LEAGUE_ID):
    league_users_by_id = db['league_users'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_users_by_id is not None:
        league_users_by_id = league_users_by_id['users']
    
    return league_users_by_id

def get_league_drafts(league_id: str = LEAGUE_ID):
    league_drafts = db['league_drafts'].find({'league_id': league_id}, {'_id': 0})

    return list(league_drafts)

def get_league_draft_picks(draft_id: str, league_id: str = LEAGUE_ID):
    draft_picks = db['league_draft_picks'].find({'league_id': league_id, 'draft_id': draft_id}, {'_id': 0}).sort('pick_no', 1)

    return list(draft_picks)

def get_league_rosters(year: int, league_id: str = LEAGUE_ID):
    league_rosters_by_id = db['league_rosters'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_rosters_by_id is not None:
        league_rosters_by_id = league_rosters_by_id['rosters']

    return league_rosters_by_id

def get_league_matchups(year: int, league_id: str = LEAGUE_ID):
    league_matchups = db['league_matchups'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_matchups is not None:
        league_matchups = league_matchups['matchups']

    return league_matchups

def get_league_transactions(year: int, league_id: str = LEAGUE_ID):
    league_transactions = db['league_transactions'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_transactions is not None:
        league_transactions = league_transactions['transactions']
    
    return league_transactions

def get_league_standings(year: int, league_id: str = LEAGUE_ID):
    league_standings = db['league_standings'].find_one({'league_id': league_id, 'year': str(year)}, {'_id': 0})
    if league_standings is not None:
        league_standings = league_standings['standings']

    return league_standings

def get_league_snapshot(league_id: str, year: int, type: str):
    if type == 'waivers':
        return waivers_service.get_waivers_total_points(league_id, year)
    
def get_per_week_points():
    nfl_state = get_nfl_state()
    league_info = get_league_info()
    matchups = get_league_matchups(nfl_state['week'])

    by_roster = defaultdict(dict)
    for w, matches in matchups.items():
        for m, rosters in matches.items():
            for r, roster in rosters.items():
                prev_points = by_roster.get(r, {}).get(str(int(w)-1), {}).get('points_scored_accum', 0)
                total_points = round(roster['points'] + prev_points, 2)
                by_roster[r][w] = {}
                by_roster[r][w]['points_scored'] = roster['points']
                by_roster[r][w]['points_scored_accum'] = total_points
                collection = db['rosters_weekly_max']
                by_roster[r][w]['max_points'] = collection.find_one({'week': str(w), 'roster_id': int(r), 'matchup_id': str(m), 'league_id': str(league_info['league_id'])})['max_points']

    return by_roster

def get_teams_transactions_count():
    nfl_state = get_nfl_state()
    return get_league_transactions(nfl_state['week'])

def get_players(ids: list, year: int, week: int):
    match_pipeline = [
        {
            '$match': {
                'id': {'$in': ids},
                '$expr': {
                    '$lte': [
                        { '$toInt': '$year' },
                        year
                    ]
                },
                'week': {'$lte': week}
            }
        },
        {
            '$sort': {'id': 1, 'year': -1, 'week': -1}
        },
        {
            '$group': {
                '_id': '$id',
                'latest_record': {'$first': '$$ROOT'}
            }
        },
        {
            '$replaceRoot': {'newRoot': '$latest_record'}
        },
        {
            '$project': {'_id': 0}
        }
    ]

    return list(db['players'].aggregate(match_pipeline))

def get_player_projections(ids: list, year: str):
    return list(db['player_projections'].find({'id': {'$in': ids}, 'year': year}, {'_id': 0}))

def get_player_rankings(ids: list, year: str, week: str):
    return list(db['player_rankings'].find({'id': {'$in': ids}, 'year': year, 'week': week}, {'_id':0}))

def get_player_adps(ids: list, year: str):
    return list(db['player_adps'].find({'id': {'$in': ids}, 'year': year}, {'_id': 0}))
import argparse
import datetime
from api.services import sleeper, main
import copy
from api.utils.utils import get_env
import os
import time
from api.mongodb_client import get_db

db = get_db()
get_env()
LEAGUE_ID = os.getenv('LEAGUE_ID')

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=True, help='league id')
args = parser.parse_args()

def compile_league_max_points(matchups_by_week: dict, rosters: dict, info: dict, end_week: int, league_id: str):
    year = info['season']
    positions = info['roster_positions']
    try:
        league_positions = [position for position in positions if position != 'BN']
        league_max_points = {}
        for week, week_matchups in matchups_by_week.items():
            if int(week) < end_week:
                league_max_points[week] = {}
                for _, matchup_rosters in week_matchups.items():
                    for roster_id, roster in matchup_rosters.items():
                        league_max_points[week][roster_id] = {'ppf': 0, 'max_roster': {}}
                        players_points = roster['players_points'] # {player_id: points}
                        players_data = db['players'].find({'id': {'$in': list(players_points.keys())}, 'year': year}, {'_id': 0})
                        roster_data = [{'id': p['id'], 'points': players_points[p['id']], 'positions': p['player']['fantasy_positions']} for p in players_data]
                        # sort the roster by number of positions (ascending), points (descending)
                        for i in range(1, len(roster_data)):
                            j = i
                            while (j >= 1 and
                                (len(roster_data[j]['positions']) < len(roster_data[j-1]['positions']) or
                                    (len(roster_data[j]['positions']) == len(roster_data[j-1]['positions']) and
                                    roster_data[j]['points'] > roster_data[j-1]['points'])
                                )
                            ):
                                temp = roster_data[j]
                                roster_data[j] = roster_data[j-1]
                                roster_data[j-1] = temp
                                j -= 1
                        # calculate potential max points
                        ppf = 0
                        max_roster = {key: [] for key in set(league_positions)}
                        avail_pos = copy.copy(league_positions)
                        for p_data in roster_data:
                            p_points = p_data['points']
                            p_positions = p_data['positions']
                            if len(p_positions) == 1:
                                p_pos = p_positions[0]
                                if p_pos in avail_pos:
                                    max_roster[p_pos].append(p_data)
                                    avail_pos.remove(p_pos)
                                    ppf += p_points
                                elif p_pos in ['RB', 'WR', 'TE'] and 'FLEX' in avail_pos:
                                    max_roster['FLEX'].append(p_data)
                                    avail_pos.remove('FLEX')
                                    ppf += p_points
                            elif len(p_positions) > 1:
                                max_diff = 0
                                replace_pos = None
                                for pos in p_positions:
                                    for p in max_roster[pos][::-1]:
                                        score = p['points']
                                        if p_points - score > max_diff:
                                            max_diff = p_points - score
                                            replace_pos = pos
                                    if pos in ['RB', 'WR', 'TE']:
                                        for p in max_roster['FLEX'][::-1]:
                                            score = p['points']
                                            if p_points - score > max_diff:
                                                max_diff = p_points - score
                                                replace_pos = 'FLEX'
                                if replace_pos is not None:
                                    ppf += max_diff
                                    max_roster[replace_pos][-1] = p_data
                        league_max_points[week][roster_id]['ppf'] = ppf
                        league_max_points[week][roster_id]['max_roster'] = max_roster
        doc_id = db['league_max_scores'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'max_scores': league_max_points, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
            },
            upsert=True
        )
    except Exception as e:
        raise Exception(f'Error updating league max points data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league max points data]')
    league_info = sleeper.get_league_info(args.league)
    regular_season_end = league_info['settings']['playoff_week_start']
    matchups = main.get_league_matchups(league_info['season'], args.league)
    rosters = main.get_league_rosters(league_info['season'], args.league)

    if matchups is None:
        raise Exception(f'Error updating league standings data. Requires matchups data.')
    elif rosters is None:
        raise Exception(f'Error updating league standgins data. Requires rosters data.')
    else:
        compile_league_max_points(matchups, rosters, league_info, regular_season_end, args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
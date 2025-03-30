import argparse
import datetime
import time
from api.services import sleeper, main
from api.mongodb_client import get_db

db = get_db()

parser = argparse.ArgumentParser()
parser.add_argument('--league', type=str, required=True, help='league id')
args = parser.parse_args()

def compile_league_potential_points(matchups_by_week: dict, rosters: dict, info: dict, end_week: int, league_id: str):
    year = info['season']
    positions = info['roster_positions']
    try:
        league_positions = [position for position in positions if position != 'BN']
        league_min_max_points = {}
        for week, week_matchups in matchups_by_week.items():
            if int(week) < end_week:
                league_min_max_points[week] = {}
                for _, matchup_rosters in week_matchups.items():
                    for roster_id, roster in matchup_rosters.items():
                        league_min_max_points[week][roster_id] = {'ppf_max': 0, 'max_roster': {}, 'ppf_min': 0, 'min_roster': {}}
                        players_points = roster['players_points'] # {player_id: points}
                        players_data = db['players'].find({'id': {'$in': list(players_points.keys())}, 'year': year}, {'_id': 0})
                        max_roster_data = [{'id': p['id'], 'points': players_points[p['id']], 'positions': p['player']['fantasy_positions']} for p in players_data]
                        # sort the roster by number of positions (ascending), points (descending)
                        num_multi = 0
                        for i in range(1, len(max_roster_data)):
                            j = i
                            while (j >= 1 and
                                (len(max_roster_data[j]['positions']) < len(max_roster_data[j-1]['positions']) or
                                    (len(max_roster_data[j]['positions']) == len(max_roster_data[j-1]['positions']) and
                                    max_roster_data[j]['points'] > max_roster_data[j-1]['points'])
                                )
                            ):
                                if len(max_roster_data[j]['positions']) > 1:
                                    num_multi += 1
                                temp = max_roster_data[j]
                                max_roster_data[j] = max_roster_data[j-1]
                                max_roster_data[j-1] = temp
                                j -= 1
                        len_roster = len(max_roster_data)
                        min_roster_data = list(reversed(max_roster_data[:len_roster-num_multi])) + list(reversed(max_roster_data[len_roster-num_multi:]))
                        # calculate potential min/max points
                        ppf_max = 0
                        ppf_min = 0
                        max_roster = {key: [] for key in set(league_positions)}
                        min_roster = {key: [] for key in set(league_positions)}
                        avail_max_pos = league_positions[:]
                        avail_min_pos = league_positions[:]

                        for p_data in max_roster_data:
                            p_points = p_data['points']
                            p_positions = p_data['positions']
                            if len(p_positions) == 1:
                                p_pos = p_positions[0]
                                if p_pos in avail_max_pos:
                                    max_roster[p_pos].append(p_data)
                                    avail_max_pos.remove(p_pos)
                                    ppf_max = round(ppf_max + p_points, 2)
                                elif p_pos in ['RB', 'WR', 'TE'] and 'FLEX' in avail_max_pos:
                                    max_roster['FLEX'].append(p_data)
                                    avail_max_pos.remove('FLEX')
                                    ppf_max = round(ppf_max + p_points, 2)
                            elif len(p_positions) > 1:
                                max_diff = 0
                                replace_max = None
                                for pos in p_positions:
                                    # only need to check last score because we can only replace 1 score anyways
                                    # if the player's score is lower than the last score then we don't replace
                                    if p_points > (max_roster[pos][-1]['points'] if len(max_roster[pos]) > 0 else 0):
                                        if len(max_roster[pos]) == 0:
                                            curr_diff = round(p_points, 2)
                                        else:
                                            curr_diff = round(p_points - max_roster[pos][-1]['points'], 2)
                                        if curr_diff > max_diff:
                                            max_diff = curr_diff
                                            replace_max = pos
                                    if pos in ['RB', 'WR', 'TE'] and 'QB' not in p_positions:
                                        if p_points > (max_roster['FLEX'][-1]['points'] if len(max_roster['FLEX']) > 0 else 0):
                                            if len(max_roster['FLEX']) == 0:
                                                curr_diff = round(p_points, 2)
                                            else:
                                                curr_diff = round(p_points - max_roster[pos][-1]['points'], 2)
                                            if curr_diff > max_diff:
                                                max_diff = curr_diff
                                                replace_max = 'FLEX'
                                if replace_max is not None:
                                    ppf_max = round(ppf_max + max_diff, 2)
                                    if len(max_roster[replace_max]) > 0:
                                        max_roster[replace_max][-1] = p_data
                                    else:
                                        max_roster[replace_max].append(p_data)
                        for p_data in min_roster_data:
                            p_points = p_data['points']
                            p_positions = p_data['positions']
                            if len(p_positions) == 1:
                                p_pos = p_positions[0]
                                if p_pos in avail_min_pos:
                                    min_roster[p_pos].append(p_data)
                                    avail_min_pos.remove(p_pos)
                                    ppf_min = round(ppf_min + p_points, 2)
                                elif p_pos in ['RB', 'WR', 'TE'] and 'FLEX' in avail_min_pos:
                                    min_roster['FLEX'].append(p_data)
                                    avail_min_pos.remove('FLEX')
                                    ppf_min = round(ppf_min + p_points, 2)
                            elif len(p_positions) > 1:
                                min_diff = 99999
                                replace_min = None
                                for pos in p_positions:
                                    if p_points < (min_roster[pos][0]['points'] if len(min_roster[pos]) > 0 else 99999):
                                        if len(min_roster[pos]) == 0:
                                            curr_diff = round(p_points, 2)
                                        else:
                                            curr_diff = round(p_points - min_roster[pos][0]['points'], 2)
                                        if curr_diff < min_diff:
                                            min_diff = curr_diff
                                            replace_min = pos
                                    if pos in ['RB', 'WR', 'TE'] and 'QB' not in p_positions:
                                        if p_points < (min_roster['FLEX'][0]['points'] if len(min_roster['FLEX']) > 0 else 99999):
                                            if len(min_roster['FLEX']) == 0:
                                                curr_diff = round(min_roster['FLEX'], 2)
                                            else:
                                                curr_diff = round(min_roster['FLEX'][0]['points'] - p_points, 2)
                                            if curr_diff < min_diff:
                                                min_diff = curr_diff
                                                replace_min = 'FLEX'
                                if replace_min is not None:
                                    ppf_min = round(ppf_min - min_diff, 2)
                                    if len(min_roster[replace_min]) > 0:
                                        min_roster[replace_min].pop(0)
                                    min_roster[replace_min].append(p_data)
                        league_min_max_points[week][roster_id]['ppf_max'] = round(ppf_max, 2)
                        league_min_max_points[week][roster_id]['max_roster'] = max_roster
                        league_min_max_points[week][roster_id]['ppf_min'] = round(ppf_min, 2)
                        league_min_max_points[week][roster_id]['min_roster'] = min_roster
        doc_id = db['league_potential_points'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'potential_points': league_min_max_points, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
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
    matchups = main.get_league_matchups(args.league, league_info['season'])
    rosters = main.get_league_rosters(args.league, league_info['season'], )

    if matchups is None:
        raise Exception(f'Error updating league points data. Requires matchups data.')
    elif rosters is None:
        raise Exception(f'Error updating league points data. Requires rosters data.')
    else:
        compile_league_potential_points(matchups, rosters, league_info, regular_season_end, args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
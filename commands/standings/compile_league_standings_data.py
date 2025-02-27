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

def compile_league_standings(matchups_by_week: dict, rosters: dict, year: str, end_week: int, league_id: str):
    try:
        team_overall_records = {}
        team_records = {}
        for roster, data in rosters.items():
            team_records[roster] = {
                'record': data['metadata']['record'],
                'wins': data['settings']['wins'],
                'losses': data['settings']['losses'],
                'overall_wins': 0,
                'overall_losses': 0,
                'points': data['settings']['fpts'] + data['settings']['fpts_decimal'] / 100
            }
        weekly_matchups_array = list(matchups_by_week.items())[:end_week]
        weekly_standings = {weekly_matchups_array[-1][0]: [{roster[0]: roster[1]} for roster in sorted(copy.deepcopy(team_records).items(), key=lambda roster: (roster[1]['wins'], -roster[1]['losses'], roster[1]['points']), reverse=True)]}
        for weekly_matchups in weekly_matchups_array[-1::-1]:
            week = weekly_matchups[0]
            team_overall_records[str(int(week)-1)] = {}
            team_points = []
            for matchup_teams in weekly_matchups[1].values():
                for team, stats in matchup_teams.items():
                    team_overall_records[str(int(week)-1)][team] = {'wins': 0, 'losses': 0}
                    result = team_records[team]['record'][-1]
                    team_records[team]['record'] = team_records[team]['record'][:-1]
                    team_records[team]['wins'] = team_records[team]['wins'] - 1 if result == 'W' else team_records[team]['wins']
                    team_records[team]['losses'] = team_records[team]['losses'] - 1 if result == 'L' else team_records[team]['losses']
                    team_records[team]['points'] = round(team_records[team]['points'] - stats['points'], 2)
                    team_points.append((team, stats['points']))
            for i, tup in enumerate(sorted(team_points, key=lambda x: (x[1]), reverse=True)):
                team_overall_records[str(int(week)-1)][tup[0]]['wins'] = len(team_records.keys()) - i - 1 # e.g. 1st out of 10 teams should be 10 - 0 - 1 = 9 wins
                team_overall_records[str(int(week)-1)][tup[0]]['losses'] = i # e.g. last place of 10 should be 9 = 9 losses
            weekly_standings[str(int(week)-1)] = [{roster[0]: roster[1]} for roster in sorted(copy.deepcopy(team_records).items(), key=lambda roster: (roster[1]['wins'], -roster[1]['losses'], roster[1]['points']), reverse=True)]
        for week, records in reversed(list(team_overall_records.items())):
            prev_week_stats = team_overall_records.get(str(int(week)-1), None)
            for team in records.keys():
                if prev_week_stats:
                    team_overall_records[week][team]['wins'] += prev_week_stats[team]['wins']
                    team_overall_records[week][team]['losses'] += prev_week_stats[team]['losses']

        for week, standings in weekly_standings.items():
            if int(week) > 0:
                for data in standings:
                    for team_id, stats in data.items():
                        stats['overall_wins'] = team_overall_records[str(int(week)-1)][team_id]['wins']
                        stats['overall_losses'] = team_overall_records[str(int(week)-1)][team_id]['losses']

        doc_id = db['league_standings'].update_one(
            {
                'league_id': league_id,
                'year': year
            }, 
            {
                '$setOnInsert': {'created_at': datetime.datetime.now(datetime.timezone.utc)},
                '$set': {'standings': weekly_standings, 'updated_at': datetime.datetime.now(datetime.timezone.utc)}
            },
            upsert=True
        )
    except Exception as e:
        print(e)
        raise Exception(f'Error updating league standings data: {e}')

if __name__ == '__main__':
    start = time.time()

    print(f'>> compiling [league standings data]')
    league_info = sleeper.get_league_info(args.league)
    matchups = main.get_league_matchups(league_info['season'], args.league)
    rosters = main.get_league_rosters(league_info['season'], args.league)
    regular_season_end_week = league_info['settings']['playoff_week_start']-1
    if matchups is None:
        raise Exception(f'Error updating league standings data. Requires matchups data.')
    elif rosters is None:
        raise Exception(f'Error updating league standgins data. Requires rosters data.')
    else:
        compile_league_standings(matchups, rosters, league_info['season'], regular_season_end_week, args.league)

    end = time.time()
    print(f'=== finished in {end - start} seconds ===')
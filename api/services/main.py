from collections import defaultdict
from typing import TypedDict
from redis_client import save, get, clear
from dotenv import load_dotenv
import json
import os
import requests
import services.sleeper as Sleeper

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')

def clear_redis() -> None:
    clear()

def init() -> bool:
    try:
        nfl_state = get_nfl_state()
        league_info = get_league_info()
        league_users = get_league_users()
        league_rosters = get_league_rosters()
        league_matchups = get_league_matchups(nfl_state['week'])

        return {
            'nfl_state': nfl_state,
            'league_info': league_info,
            'league_users': league_users,
            'league_rosters': league_rosters,
            'league_matchups': league_matchups[f'{nfl_state["week"]}']
        }
    except Exception as e:
        print(str(e))
        return False

def get_nfl_state():
    nfl_state = get('nfl_state')
    if not nfl_state:
        print('fetching nfl state')
        nfl_state = Sleeper.get_nfl_state()
        save('nfl_state', json.dumps(nfl_state), (60*10))
    else:
        print('found nfl state in redis')
        nfl_state = json.loads(nfl_state)
    
    return nfl_state

def get_league_info():
    league_info = get(f'{LEAGUE_ID}_info')
    if not league_info:
        print('fetching league info')
        league_info = Sleeper.get_league_info(LEAGUE_ID)
        save(f'{LEAGUE_ID}_info', json.dumps(league_info), (60*10))
    else:
        print('found league info in redis')
        league_info = json.loads(league_info)

    return league_info

def get_league_users():
    league_users_by_id = get(f'{LEAGUE_ID}_users')
    if not league_users_by_id:
        print('fetching league users')
        league_users = Sleeper.get_league_users(LEAGUE_ID)
        league_users_by_id = {user['user_id']: user for user in league_users}
        save(f'{LEAGUE_ID}_users', json.dumps(league_users_by_id), (60*10))
    else:
        print('found league users in redis')
        league_users_by_id = json.loads(league_users_by_id)

    return league_users_by_id

def get_league_rosters():
    league_rosters_by_id = get(f'{LEAGUE_ID}_rosters')
    if not league_rosters_by_id:
        print('fetching league rosters')
        league_rosters = Sleeper.get_league_rosters(LEAGUE_ID)
        league_rosters_by_id = {roster['roster_id']: roster for roster in league_rosters}
        save(f'{LEAGUE_ID}_rosters', json.dumps(league_rosters_by_id), (60*10))
    else:
        print('found league rosters in redis')
        league_rosters_by_id = json.loads(league_rosters_by_id)

    return league_rosters_by_id

def get_league_matchups(end_week: int):
    league_matchups_by_week = get(f'{LEAGUE_ID}_matchups')
    if not league_matchups_by_week:
        print('fetching league matchups')
        league_matchups_by_week = {}
        for w in range(1, end_week+1):
            week_matchups = Sleeper.get_league_matchups_for_week(LEAGUE_ID, w)
            matchups_by_id = defaultdict(dict)
            for m in week_matchups:
                matchups_by_id[m['matchup_id']][m['roster_id']] = m

            league_matchups_by_week[w] = matchups_by_id
        print(league_matchups_by_week)
        save(f'{LEAGUE_ID}_matchups', json.dumps(league_matchups_by_week), (60*10))
    else:
        print('found league matchups in redis')
        league_matchups_by_week = json.loads(league_matchups_by_week)
    
    return league_matchups_by_week

def get_current_standings():
    rosters = get(f'{LEAGUE_ID}_rosters')
    if not rosters:
        rosters = get_league_rosters()
    else:
        rosters = json.loads(rosters)

    return [roster[1] for roster in sorted(rosters.items(), key=lambda roster: (roster[1]['settings']['wins'], -roster[1]['settings']['losses'], roster[1]['settings']['ties'], roster[1]['settings']['fpts'], roster[1]['settings']['fpts_decimal']), reverse=True)]
    
def get_per_week_points():
    nfl_state = get_nfl_state()
    league_rosters = get_league_rosters()
    matchups = get_league_matchups(nfl_state['week'])

    by_week = defaultdict(dict)
    by_roster = defaultdict(dict)
    # weekly_roster_stats = {week: {roster_id: {} for roster_id in league_rosters.keys()} for week in matchups.keys()}
    for w, matches in matchups.items():
        by_week[w] = {}
        for m, rosters in matchups[w].items():
            for r, roster in rosters.items():
                by_week[w][r] = {}
                by_week[w][r]['pf'] = roster['points']
                prev_points = by_week.get(str(int(w)-1), {}).get(r, {}).get('pft', 0)
                total_points = round(roster['points'] + prev_points, 2)
                by_week[w][r]['pft'] = total_points
                by_roster[r][w] = {}
                by_roster[r][w]['pf'] = roster['points']
                by_roster[r][w]['pft'] = total_points

    return by_roster
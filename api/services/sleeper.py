from api.utils.utils import get_env
import os
import requests

get_env()
SLEEPER_URL = os.getenv('SLEEPER_BASE_URL')

def get_nfl_state():
    return requests.get(f'{SLEEPER_URL}/state/nfl').json()

def get_nfl_players():
    return requests.get(f'{SLEEPER_URL}/players/nfl').json()

def get_league_info(league_id: str):
    return requests.get(f'{SLEEPER_URL}/league/{league_id}').json()

def get_league_users(league_id: str):
    return requests.get(f'{SLEEPER_URL}/league/{league_id}/users').json()

def get_league_rosters(league_id: str):
    return requests.get(f'{SLEEPER_URL}/league/{league_id}/rosters').json()

def get_league_drafts(league_id: str):
    return requests.get(f'{SLEEPER_URL}/league/{league_id}/drafts').json()

def get_draft_picks(draft_id: str):
    return requests.get(f'{SLEEPER_URL}/draft/{draft_id}/picks').json()

def get_league_matchups_for_week(league_id: str, week: int):
    return requests.get(f'{SLEEPER_URL}/league/{league_id}/matchups/{week}').json()

def get_league_transactions_for_week(league_id: str, week: int):
    return requests.get(f'{SLEEPER_URL}/league/{league_id}/transactions/{week}').json()

def get_league_playoffs_bracket(league_id: str):
    w_bracket = requests.get(f'{SLEEPER_URL}/league/{league_id}/winners_bracket').json()
    l_bracket = requests.get(f'{SLEEPER_URL}/league/{league_id}/losers_bracket').json()

    return {
        'winners': w_bracket,
        'losers': l_bracket
    }
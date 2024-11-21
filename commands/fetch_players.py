from datetime import datetime
from dotenv import load_dotenv
import json
import os
import requests
from save_players import save_player_data

load_dotenv()
today = datetime.today().strftime('%Y-%m-%d')

def fetch_sleeper_players(league: str):
    url = f'{os.getenv('SLEEPER_BASE_URL')}/players/{league}'

    data = requests.get(url)

    data_dir = f'{os.getenv('DATA_DIR')}'
    if not os.path.exists(data_dir):
            os.makedirs(data_dir)
    
    filepath = f'{data_dir}/{league}_players_{today}'
    with open(filepath, 'w') as playersfile:
        json.dump(data.json(), playersfile)

    save_player_data(filepath, league)

if __name__ == '__main__':
    fetch_sleeper_players('nfl')
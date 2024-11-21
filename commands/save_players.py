import certifi
from dotenv import load_dotenv
import filecmp
import glob
import json
import os
from pymongo import MongoClient
import ssl

cert = ssl.create_default_context(cafile=certifi.where())
load_dotenv()
mongo_user = os.getenv('MONGO_USER')
mongo_pass = os.getenv('MONGO_PASSWORD')
mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())

def check_diffs(filepath: str, league: str) -> bool:
    files = glob.glob(f'{os.getenv('DATA_DIR')}/{league}_players_*')
    if not files:
        return True

    last_file = max(files, key=os.path.getctime)

    return filecmp.cmp(filepath, last_file, shallow=False)


def save_player_data(filepath: str, league: str):
    # has_diff = check_diffs(filepath, league)
    # print(has_diff)
    print('saving player data...')
    db = mdb['nfl']
    collection = db['players']
    collection.delete_many({})

    with open(filepath, 'r') as playersfile:
        data = json.loads(playersfile.read())
        try:
            doc_ids = collection.insert_many(data.values())
            print(f'Player data saved! ({len(doc_ids.inserted_ids)})')
        except Exception as e:
            print(f'Error saving player data to db: {e}')
    
    mdb.close()
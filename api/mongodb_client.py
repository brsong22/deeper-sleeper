from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
import certifi
import json
import os
import ssl

load_dotenv()
LEAGUE_ID = os.getenv('LEAGUE_ID')
cert = ssl.create_default_context(cafile=certifi.where())
mongo_user = json.loads(os.getenv('MONGO_CREDENTIALS'))['MONGO_USER']
mongo_pass = json.loads(os.getenv('MONGO_CREDENTIALS'))['MONGO_PASSWORD']

mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
db = mdb['nfl']

def get_db():

    return db

def upsert_one(collection: str, filter: dict, update: dict):
    doc_id = db[collection].update_one(filter, {'$set': update}, upsert=True)
    
    return doc_id

def upsert_many(collection: str, operations: list[UpdateOne]):
        doc_ids = db[collection].bulk_write(operations)

        return doc_ids


import boto3
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
import certifi
import json
import os
import ssl

load_dotenv()

cert = ssl.create_default_context(cafile=certifi.where())

def get_mongo_credentials():
    client = boto3.client('secretsmanager', region_name='us-east-1')

    username_arn = os.getenv('AWS_SECRET_MONGO_USER_ARN')
    username_value = client.get_secret_value(SecretId=username_arn)
    password_arn = os.getenv('AWS_SECRET_MONGO_PASSWORD_ARN')
    password_value = client.get_secret_value(SecretId=password_arn)

    if 'SecretString' in username_value:
        username = json.loads(username_value['SecretString'])
    else:
        username = json.loads(username_value['SecretBinary'].decode('utf-8'))
    if 'SecretString' in password_value:
        password = json.loads(password_value['SecretString'])
    else:
        password = json.loads(password_value['SecretBinary'].decode('utf-8'))

    # Extract the MongoDB credentials
    mongo_user = username['MONGODB_USER']
    mongo_pass = password['MONGODB_PASSWORD']
    mongo_connection = os.getenv('MONGO_CONNECTION_STRING').format(mongo_user=mongo_user, mongo_password=mongo_pass)
    
    return mongo_connection

def get_db():

    return db

def upsert_one(collection: str, filter: dict, update: dict):
    doc_id = db[collection].update_one(filter, {'$set': update}, upsert=True)
    
    return doc_id

def upsert_many(collection: str, operations: list[UpdateOne]):
        doc_ids = db[collection].bulk_write(operations)

        return doc_ids

mongo_connection = get_mongo_credentials()
mdb = MongoClient(mongo_connection, tls=True, tlsCAFile=certifi.where())
db = mdb['nfl']
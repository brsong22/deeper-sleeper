from dotenv import load_dotenv
import os
import redis

load_dotenv()

redis_host = os.getenv('REDIS_HOST')
redis_port = int(os.getenv('REDIS_PORT'))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)

def ping():
    try:
        redis_client.ping()
        return {'message': 'success', 'status': 200}

    except Exception as e:
        return {'message': f'failed: {e}', 'status': 500}

def save(key: str, data: str, ttl: int = None) -> None:
    if ttl:
        redis_client.set(key, data, ttl)
    else:
        redis_client.set(key, data)

def get(key: str) -> str:
    return redis_client.get(key)
        
def clear() -> None:
    redis_client.flushall()
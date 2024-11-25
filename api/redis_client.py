import redis

redis_client = redis.Redis(host='deepersleeper_redis', port=6379, db=0)

def save(key: str, data: str, ttl: int = None) -> None:
    if ttl:
        redis_client.set(key, data, ttl)
    else:
        redis_client.set(key, data)

def get(key: str) -> str:
    return redis_client.get(key)
        
def clear() -> None:
    redis_client.flushall()
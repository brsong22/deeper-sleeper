from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import services.sleeper as Sleeper
import services.main as Main

app = FastAPI()
# origins = [
#     "http://localhost:3000",  # React app running on localhost
#     "http://44.212.221.0:3000"
#     # "https://yourfrontenddomain.com",  # If you have a production frontend
# ]
origins = [url.strip().rstrip('/') for url in os.getenv('ALLOW_ORIGINS').split(',')]
print(origins)
# Add CORSMiddleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows only these origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (Content-Type, Authorization, etc.)
)

load_dotenv()

@app.get('/healthcheck')
async def healthstatus():
    # return Main.ping()
    return {"message": 'ok'}

# just for an easy option to clear redis
# @app.get('/reset')
# async def clear() -> None:
#     Main.clear_redis()

@app.get('/league/{league_id}')
async def init(league_id: str, year: int) -> None:
    if not (res := Main.init(year, league_id)):
        print(res)
        raise HTTPException(status_code=500, detail="Error occurred retrieving resources.")
    return res
    
@app.get('/league/{league_id}/state')
async def get_league_state(league_id: str, year: int):
    return Main.get_league_state(year, league_id)

@app.get('/league/{league_id}/drafts')
async def get_league_drafts(league_id: str, year: int):
    return Main.get_league_drafts(league_id)

@app.get('/league/{league_id}/points-per-week')
async def get_per_week_stats(league_id: str, year: int):
    return Main.get_per_week_points()

@app.get('/league/{league_id}/standings-per-week')
async def get_rankings(league_id: str, year: int):
    return Main.get_league_standings(year, league_id)

@app.get('/league/{league_id}/transactions-per-week')
async def get_transactions_count(league_id: str, year: int):
    return Main.get_league_transactions(year, league_id)
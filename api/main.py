from api.utils.utils import get_env
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import api.services.sleeper as Sleeper
import api.services.main as Main

app = FastAPI()

origins = [url.strip() for url in os.getenv('ALLOW_ORIGINS').split(',')]

# Add CORSMiddleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows only these origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (Content-Type, Authorization, etc.)
)

get_env()

@app.get('/healthcheck')
async def healthstatus():
    return {"message": 'ok'}

@app.get('/league/{league_id}')
async def init(league_id: str, year: int) -> None:
    if not (res := Main.init(year, league_id)):
        print(res)
        raise HTTPException(status_code=500, detail="Error occurred retrieving resources.")
    if not res['league_info'] or not res['league_users'] or not res['league_rosters']:
        raise HTTPException(status_code=404, detail="Could not find league records.")
    return res

@app.get('/league/{league_id}/drafts')
async def get_league_drafts(league_id: str):
    return Main.get_league_drafts(league_id)

@app.get('/league/{league_id}/matchups-per-week')
async def get_league_matchups(league_id: str, year: int):
    return Main.get_league_matchups(year, league_id)

@app.get('/league/{league_id}/drafts/{draft_id}')
async def get_league_draft_picks(league_id: str, draft_id: str):
    return Main.get_league_draft_picks(draft_id, league_id)

@app.get('/league/{league_id}/potential-points-per-week')
async def get_per_week_stats(league_id: str, year: int):
    return Main.get_league_potential_points(league_id, year)

@app.get('/league/{league_id}/standings-per-week')
async def get_rankings(league_id: str, year: int):
    return Main.get_league_standings(year, league_id)

@app.get('/league/{league_id}/transactions-per-week')
async def get_transactions_count(league_id: str, year: int):
    return Main.get_league_transactions(year, league_id)

@app.get('/league/{league_id}/snapshot')
async def get_snapshot(league_id: str, year: int, type: str):
    return Main.get_league_snapshot(league_id, year, type)

@app.get('/players')
async def get_players(year: int, week: int, ids: List[str] = Query()):
    return Main.get_players(ids, year, week)

@app.get('/player-projections')
async def get_player_projections(year: str, ids: List[str] = Query()):
    return Main.get_player_projections(ids, year)

@app.get('/player-rankings')
async def get_player_rankings(year: str, week: str, ids: List[str] = Query()):
    return Main.get_player_rankings(ids, year, week)

@app.get('/player-adps')
async def get_player_adps(year: str, ids: List[str] = Query()):
    return Main.get_player_adps(ids, year)
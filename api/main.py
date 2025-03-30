from api.utils.utils import get_env
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import api.services.main as Main
import api.param_models as Params

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

@app.get('/leagues/{league_id}')
async def init(league_id: str, year = Depends(Params.get_year_int)) -> None:
    if not (res := Main.init(league_id, year.year)):
        print(res)
        raise HTTPException(status_code=500, detail="Error occurred retrieving resources.")
    if not res['league_info'] or not res['league_users'] or not res['league_rosters']:
        raise HTTPException(status_code=404, detail="Could not find league records.")
    return res

@app.get('/leagues/{league_id}/years')
async def get_league_years(league_id: str):
    return Main.get_league_years(league_id)

@app.get('/leagues/{league_id}/drafts')
async def get_league_drafts(league_id: str, year: int = Query(None)):
    return Main.get_league_drafts(league_id, year)

@app.get('/leagues/{league_id}/matchups-per-week')
async def get_league_matchups(league_id: str, year = Depends(Params.get_year_int)):
    return Main.get_league_matchups(league_id, year.year)

@app.get('/leagues/{league_id}/drafts/{draft_id}')
async def get_league_draft_picks(league_id: str, draft_id: str):
    return Main.get_league_draft_picks(league_id, draft_id)

@app.get('/leagues/{league_id}/potential-points-per-week')
async def get_per_week_stats(league_id: str, year = Depends(Params.get_year_int)):
    return Main.get_league_potential_points(league_id, year.year)

@app.get('/leagues/{league_id}/standings-per-week')
async def get_rankings(league_id: str, year = Depends(Params.get_year_int)):
    return Main.get_league_standings(league_id, year.year)

@app.get('/leagues/{league_id}/transactions-per-week')
async def get_transactions_count(league_id: str, year = Depends(Params.get_year_int)):
    return Main.get_league_transactions(league_id, year.year)

@app.get('/leagues/{league_id}/snapshot')
async def get_snapshot(league_id: str, year = Depends(Params.get_year_int), type = Depends(Params.get_snapshot_type)):
    return Main.get_league_snapshot(league_id, year.year, type.type)

@app.get('/players')
async def get_players(year = Depends(Params.get_year_int), week = Depends(Params.get_week_int), ids = Depends(Params.get_player_ids)):
    return Main.get_players(ids.ids, year.year, week.week)

@app.get('/player-projections')
async def get_player_projections(year = Depends(Params.get_year_str), ids = Depends(Params.get_player_ids)):
    return Main.get_player_projections(ids.ids, year.year)

@app.get('/player-rankings')
async def get_player_rankings(year = Depends(Params.get_year_str), week = Depends(Params.get_week_str), ids = Depends(Params.get_player_ids)):
    return Main.get_player_rankings(ids.ids, year.year, week.week)

@app.get('/player-adps')
async def get_player_adps(year = Depends(Params.get_year_str), ids = Depends(Params.get_player_ids)):
    return Main.get_player_adps(ids.ids, year.year)
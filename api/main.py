from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import services.sleeper as Sleeper
import services.main as Main

app = FastAPI()
origins = [
    "http://localhost:5173",  # React app running on localhost
    # "https://yourfrontenddomain.com",  # If you have a production frontend
]

# Add CORSMiddleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows only these origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (Content-Type, Authorization, etc.)
)

load_dotenv()

# just for an easy option to clear redis
@app.get('/reset')
async def clear() -> None:
    Main.clear_redis()

@app.get('/')
async def init() -> None:
    if not (res := Main.init()):
        print(res)
        raise HTTPException(status_code=500, detail="Error occurred retrieving resources.")
    return res
    
@app.get('/standings')
async def get_team_standings():
    return Main.get_current_standings()

@app.get('/points-per-week')
async def get_per_week_stats():
    return Main.get_per_week_points()


from typing import List
from fastapi import Query
from pydantic import BaseModel, field_validator


class YearString(BaseModel):
    year: str

    @field_validator('year')
    def validate_year(cls, value):
        if not value.isdigit():
            raise ValueError('year must be a valid number')
        
        return value

class YearInt(BaseModel):
    year: int

class WeekString(BaseModel):
    week: str

    @field_validator('week')
    def validate_week(cls, value):
        if not value.isdigit():
            raise ValueError('week must be a valid number')
        
        return value
    
class WeekInt(BaseModel):
    week: int

class PlayerIds(BaseModel):
    ids: List[str] = Query(...)

    @field_validator('ids')
    def validate_ids(cls, values):
        if len(values) <= 0:
            raise ValueError('must provide at least 1 player id')
        
        return values
    
class SnapshotType(BaseModel):
    type: str = Query(...)

    @field_validator('type')
    def validate_snapshot_type(cls, value):
        if value not in ['waivers']:
            raise ValueError('invalid snapshot type')
        
        return value
    
def get_year_str(year: str = Query(...)):
    return YearString(year=year)

def get_year_int(year: int = Query(...)):
    return YearInt(year=year)

def get_week_str(week: str = Query(...)):
    return WeekString(week=week)

def get_week_int(week: int = Query(...)):
    return WeekInt(week=week)

def get_player_ids(ids: List[str] = Query(...)):
    return PlayerIds(ids=ids)

def get_snapshot_type(type: str = Query(...)):
    return SnapshotType(type=type)
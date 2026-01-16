from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import sqlite3
from starlette.concurrency import run_in_threadpool
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date, time
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite connection (single-file DB)
DB_PATH = str(ROOT_DIR / "app.db")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)


# Initialize SQLite tables
def _row_to_dict(cursor, row):
    if row is None:
        return None
    return {description[0]: row[idx] for idx, description in enumerate(cursor.description)}

def init_db_sync():
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT,
            created_at TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS venues (
            id TEXT PRIMARY KEY,
            name TEXT,
            location TEXT,
            image_url TEXT,
            owner_id TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS grounds (
            id TEXT PRIMARY KEY,
            name TEXT,
            venue_id TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS slots (
            id TEXT PRIMARY KEY,
            ground_id TEXT,
            slot_date TEXT,
            start_time TEXT,
            end_time TEXT,
            price INTEGER,
            is_booked INTEGER DEFAULT 0
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            slot_id TEXT,
            booked_at TEXT
        )
        """
    )
    conn.commit()


async def db_find_one(table: str, where_clause: str, params: tuple = ()):  # returns dict or None
    def _sync():
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {table} WHERE {where_clause} LIMIT 1", params)
        row = cur.fetchone()
        return _row_to_dict(cur, row)
    return await run_in_threadpool(_sync)


async def db_find(table: str, where_clause: str = None, params: tuple = (), limit: int = 1000):
    def _sync():
        cur = conn.cursor()
        if where_clause:
            cur.execute(f"SELECT * FROM {table} WHERE {where_clause} LIMIT ?", params + (limit,))
        else:
            cur.execute(f"SELECT * FROM {table} LIMIT ?", (limit,))
        rows = cur.fetchall()
        return [ _row_to_dict(cur, r) for r in rows]
    return await run_in_threadpool(_sync)


async def db_insert(table: str, data: dict):
    def _sync():
        cur = conn.cursor()
        keys = ",".join(data.keys())
        placeholders = ",".join(["?"] * len(data))
        cur.execute(f"INSERT INTO {table} ({keys}) VALUES ({placeholders})", tuple(data.values()))
        conn.commit()
        return data
    return await run_in_threadpool(_sync)


async def db_update(table: str, set_clause: str, params: tuple = ()):  # params should include where params
    def _sync():
        cur = conn.cursor()
        cur.execute(f"UPDATE {table} SET {set_clause}", params)
        conn.commit()
        return cur.rowcount
    return await run_in_threadpool(_sync)


async def db_delete(table: str, where_clause: str, params: tuple = ()):  # returns deleted count
    def _sync():
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {table} WHERE {where_clause}", params)
        conn.commit()
        return cur.rowcount
    return await run_in_threadpool(_sync)


# Initialize DB at import
init_db_sync()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Add CORS middleware BEFORE including router
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "player"  # player, owner, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    username: str
    email: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class VenueCreate(BaseModel):
    name: str
    location: str
    image_url: str

class VenueResponse(BaseModel):
    id: str
    name: str
    location: str
    image_url: str
    owner_id: str

class GroundCreate(BaseModel):
    name: str
    venue_id: str

class GroundResponse(BaseModel):
    id: str
    name: str
    venue_id: str

class SlotCreate(BaseModel):
    ground_id: str
    slot_date: str
    start_time: str
    end_time: str
    price: int

class SlotResponse(BaseModel):
    id: str
    ground_id: str
    slot_date: str
    start_time: str
    end_time: str
    price: int
    is_booked: bool

class BookingCreate(BaseModel):
    slot_id: str

class BookingResponse(BaseModel):
    id: str
    user_id: str
    slot_id: str
    booked_at: str
    venue_name: Optional[str] = None
    ground_name: Optional[str] = None
    slot_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    price: Optional[int] = None

class AnalyticsResponse(BaseModel):
    venue_name: str
    ground_name: str
    total_bookings: int
    total_revenue: int

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db_find_one('users', 'email = ?', (email,))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(required_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserRegister):
    # Check if user exists
    existing_user = await db_find_one('users', 'email = ? OR username = ?', (user.email, user.username))
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user_doc = {
        "id": str(datetime.now(timezone.utc).timestamp()),
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "role": user.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db_insert('users', user_doc)
    
    # Create token
    access_token = create_access_token({"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user_doc["username"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db_find_one('users', 'email = ?', (credentials.email,))
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }

# ==================== PLAYER ROUTES ====================

@api_router.get("/venues", response_model=List[VenueResponse])
async def get_venues():
    venues = await db_find('venues')
    return venues

@api_router.get("/venues/{venue_id}", response_model=VenueResponse)
async def get_venue(venue_id: str):
    venue = await db_find_one('venues', 'id = ?', (venue_id,))
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@api_router.get("/venues/{venue_id}/grounds", response_model=List[GroundResponse])
async def get_venue_grounds(venue_id: str):
    grounds = await db_find('grounds', 'venue_id = ?', (venue_id,))
    return grounds

@api_router.get("/grounds/{ground_id}/slots", response_model=List[SlotResponse])
async def get_ground_slots(ground_id: str, slot_date: Optional[str] = None):
    if slot_date:
        slots = await db_find('slots', 'ground_id = ? AND slot_date = ?', (ground_id, slot_date))
    else:
        slots = await db_find('slots', 'ground_id = ?', (ground_id,))
    for s in slots:
        if s and 'is_booked' in s:
            s['is_booked'] = bool(s['is_booked'])
    return slots

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    # Check if slot exists and is not booked
    slot = await db_find_one('slots', 'id = ?', (booking.slot_id,))
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("is_booked"):
        raise HTTPException(status_code=400, detail="Slot already booked")
    
    # Create booking
    booking_doc = {
        "id": str(datetime.now(timezone.utc).timestamp()),
        "user_id": current_user["email"],
        "slot_id": booking.slot_id,
        "booked_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db_insert('bookings', booking_doc)
    await db_update('slots', 'is_booked = ? WHERE id = ?', (1, booking.slot_id))
    
    return {
        "id": booking_doc["id"],
        "user_id": booking_doc["user_id"],
        "slot_id": booking_doc["slot_id"],
        "booked_at": booking_doc["booked_at"]
    }

@api_router.get("/bookings/my", response_model=List[BookingResponse])
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db_find('bookings', 'user_id = ?', (current_user["email"],))
    
    # Enrich bookings with slot, ground, and venue details
    enriched_bookings = []
    for booking in bookings:
        slot = await db_find_one('slots', 'id = ?', (booking["slot_id"],))
        if slot:
            ground = await db_find_one('grounds', 'id = ?', (slot["ground_id"],))
            if ground:
                venue = await db_find_one('venues', 'id = ?', (ground["venue_id"],))
                booking["venue_name"] = venue["name"] if venue else "Unknown"
                booking["ground_name"] = ground["name"]
                booking["slot_date"] = slot["slot_date"]
                booking["start_time"] = slot["start_time"]
                booking["end_time"] = slot["end_time"]
                booking["price"] = slot["price"]
        enriched_bookings.append(booking)
    
    return enriched_bookings

@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db_find_one('bookings', 'id = ? AND user_id = ?', (booking_id, current_user["email"]))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if slot is more than 1 hour away
    slot = await db_find_one('slots', 'id = ?', (booking["slot_id"],))
    if slot:
        slot_datetime = datetime.fromisoformat(f"{slot['slot_date']}T{slot['start_time']}").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) >= slot_datetime - timedelta(hours=1):
            raise HTTPException(status_code=400, detail="Cannot cancel booking within 1 hour of slot time")
    
    # Delete booking and unmark slot
    await db_delete('bookings', 'id = ?', (booking_id,))
    await db_update('slots', 'is_booked = ? WHERE id = ?', (0, booking["slot_id"]))
    
    return {"message": "Booking cancelled successfully"}

# ==================== OWNER ROUTES ====================

@api_router.post("/owner/venues", response_model=VenueResponse)
async def create_venue(venue: VenueCreate, current_user: dict = Depends(require_role(["owner", "admin"]))):
    venue_doc = {
        "id": str(datetime.now(timezone.utc).timestamp()),
        "name": venue.name,
        "location": venue.location,
        "image_url": venue.image_url,
        "owner_id": current_user["email"]
    }
    
    await db_insert('venues', venue_doc)
    return venue_doc

@api_router.get("/owner/venues", response_model=List[VenueResponse])
async def get_owner_venues(current_user: dict = Depends(require_role(["owner", "admin"]))):
    venues = await db_find('venues', 'owner_id = ?', (current_user["email"],))
    return venues

@api_router.put("/owner/venues/{venue_id}", response_model=VenueResponse)
async def update_venue(venue_id: str, venue: VenueCreate, current_user: dict = Depends(require_role(["owner", "admin"]))):
    existing_venue = await db_find_one('venues', 'id = ? AND owner_id = ?', (venue_id, current_user["email"]))
    if not existing_venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    await db_update('venues', 'name = ?, location = ?, image_url = ? WHERE id = ?', (venue.name, venue.location, venue.image_url, venue_id))
    
    updated_venue = await db_find_one('venues', 'id = ?', (venue_id,))
    return updated_venue

@api_router.delete("/owner/venues/{venue_id}")
async def delete_venue(venue_id: str, current_user: dict = Depends(require_role(["owner", "admin"]))):
    deleted = await db_delete('venues', 'id = ? AND owner_id = ?', (venue_id, current_user["email"]))
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Venue not found")
    return {"message": "Venue deleted successfully"}

@api_router.post("/owner/grounds", response_model=GroundResponse)
async def create_ground(ground: GroundCreate, current_user: dict = Depends(require_role(["owner", "admin"]))):
    # Verify venue ownership
    venue = await db_find_one('venues', 'id = ? AND owner_id = ?', (ground.venue_id, current_user["email"]))
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found or not owned by you")
    
    ground_doc = {
        "id": str(datetime.now(timezone.utc).timestamp()),
        "name": ground.name,
        "venue_id": ground.venue_id
    }
    
    await db_insert('grounds', ground_doc)
    return ground_doc

@api_router.get("/owner/grounds", response_model=List[GroundResponse])
async def get_owner_grounds(current_user: dict = Depends(require_role(["owner", "admin"]))):
    # Get all venues owned by user
    venues = await db_find('venues', 'owner_id = ?', (current_user["email"],))
    venue_ids = [v["id"] for v in venues]
    if not venue_ids:
        return []
    placeholders = ','.join(['?'] * len(venue_ids))
    grounds = await db_find('grounds', f"venue_id IN ({placeholders})", tuple(venue_ids))
    return grounds

@api_router.delete("/owner/grounds/{ground_id}")
async def delete_ground(ground_id: str, current_user: dict = Depends(require_role(["owner", "admin"]))):
    # Verify ownership through venue
    ground = await db_find_one('grounds', 'id = ?', (ground_id,))
    if not ground:
        raise HTTPException(status_code=404, detail="Ground not found")
    
    venue = await db_find_one('venues', 'id = ? AND owner_id = ?', (ground["venue_id"], current_user["email"]))
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db_delete('grounds', 'id = ?', (ground_id,))
    return {"message": "Ground deleted successfully"}

@api_router.post("/owner/slots", response_model=SlotResponse)
async def create_slot(slot: SlotCreate, current_user: dict = Depends(require_role(["owner", "admin"]))):
    # Verify ownership
    ground = await db_find_one('grounds', 'id = ?', (slot.ground_id,))
    if not ground:
        raise HTTPException(status_code=404, detail="Ground not found")
    
    venue = await db_find_one('venues', 'id = ? AND owner_id = ?', (ground["venue_id"], current_user["email"]))
    if not venue:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    slot_doc = {
        "id": str(datetime.now(timezone.utc).timestamp()),
        "ground_id": slot.ground_id,
        "slot_date": slot.slot_date,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "price": slot.price,
        "is_booked": 0
    }
    
    await db_insert('slots', slot_doc)
    return slot_doc

@api_router.get("/owner/analytics", response_model=List[AnalyticsResponse])
async def get_owner_analytics(current_user: dict = Depends(require_role(["owner", "admin"]))):
    # Get all venues owned by user
    venues = await db_find('venues', 'owner_id = ?', (current_user["email"],))
    
    analytics = []
    for venue in venues:
        grounds = await db_find('grounds', 'venue_id = ?', (venue["id"],))
        
        for ground in grounds:
            # Get all booked slots
            slots = await db_find('slots', 'ground_id = ? AND is_booked = ?', (ground["id"], 1))
            
            total_revenue = sum(slot["price"] for slot in slots)
            total_bookings = len(slots)
            
            analytics.append({
                "venue_name": venue["name"],
                "ground_name": ground["name"],
                "total_bookings": total_bookings,
                "total_revenue": total_revenue
            })
    
    return analytics

@api_router.get("/owner/dashboard")
async def get_owner_dashboard(current_user: dict = Depends(require_role(["owner", "admin"]))):
    venues = await db_find('venues', 'owner_id = ?', (current_user["email"],))
    venue_ids = [v["id"] for v in venues]
    if not venue_ids:
        return {"total_venues": 0, "total_grounds": 0, "total_slots": 0, "booked_slots": 0, "total_revenue": 0}

    placeholders = ','.join(['?'] * len(venue_ids))
    grounds = await db_find('grounds', f"venue_id IN ({placeholders})", tuple(venue_ids))
    ground_ids = [g["id"] for g in grounds]
    if not ground_ids:
        return {"total_venues": len(venues), "total_grounds": 0, "total_slots": 0, "booked_slots": 0, "total_revenue": 0}

    placeholders = ','.join(['?'] * len(ground_ids))
    all_slots = await db_find('slots', f"ground_id IN ({placeholders})", tuple(ground_ids))
    total_slots = len(all_slots)
    booked_slots = len([s for s in all_slots if s.get('is_booked')])
    all_booked_slots = [s for s in all_slots if s.get('is_booked')]
    total_revenue = sum(s.get('price', 0) for s in all_booked_slots)

    return {
        "total_venues": len(venues),
        "total_grounds": len(grounds),
        "total_slots": total_slots,
        "booked_slots": booked_slots,
        "total_revenue": total_revenue
    }

# Include router
app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        conn.close()
    except Exception:
        pass

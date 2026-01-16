import sqlite3
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DB_PATH = str(ROOT_DIR / "app.db")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_database():
    print("Seeding SQLite database...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    print(f"Using DB path: {DB_PATH}")
    # Ensure tables exist (same schema as server.init_db_sync)
    try:
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
    except Exception as e:
        print("Error creating users table:", e)
        raise
    try:
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
    except Exception as e:
        print("Error creating venues table:", e)
        raise
    try:
        cur.execute(
        """
        CREATE TABLE IF NOT EXISTS grounds (
            id TEXT PRIMARY KEY,
            name TEXT,
            venue_id TEXT
        )
        """
        )
    except Exception as e:
        print("Error creating grounds table:", e)
        raise
    try:
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
    except Exception as e:
        print("Error creating slots table:", e)
        raise
    try:
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
    except Exception as e:
        print("Error creating bookings table:", e)
        raise
    conn.commit()
    # verify tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    res = cur.fetchone()
    if not res:
        conn.close()
        raise RuntimeError(f"Failed to create users table in DB at {DB_PATH}")
    # clear tables
    cur.execute("DELETE FROM users")
    cur.execute("DELETE FROM venues")
    cur.execute("DELETE FROM grounds")
    cur.execute("DELETE FROM slots")
    cur.execute("DELETE FROM bookings")

    owner_email = "owner@boxgames.com"
    owner = (
        "owner123",
        "johndoe",
        owner_email,
        pwd_context.hash("password123"),
        "owner",
        datetime.now(timezone.utc).isoformat()
    )
    cur.execute("INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)", owner)
    print(f"Created owner: {owner_email}")

    player_email = "player@boxgames.com"
    player = (
        "player123",
        "janesmith",
        player_email,
        pwd_context.hash("password123"),
        "player",
        datetime.now(timezone.utc).isoformat()
    )
    cur.execute("INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)", player)
    print(f"Created player: {player_email}")

    venues = [
        ("venue1", "Elite Sports Arena", "Downtown, Mumbai", "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800", owner_email),
        ("venue2", "Champions Ground", "Bandra West, Mumbai", "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800", owner_email),
        ("venue3", "Victory Sports Complex", "Andheri East, Mumbai", "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", owner_email),
        ("venue4", "Power Play Turf", "Powai, Mumbai", "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800", owner_email)
    ]
    cur.executemany("INSERT INTO venues (id, name, location, image_url, owner_id) VALUES (?, ?, ?, ?, ?)", venues)
    print(f"Created {len(venues)} venues")

    grounds = []
    ground_id_counter = 1
    for v in venues:
        for i in range(2):
            grounds.append((f"ground{ground_id_counter}", f"Ground {i+1}", v[0]))
            ground_id_counter += 1
    cur.executemany("INSERT INTO grounds (id, name, venue_id) VALUES (?, ?, ?)", grounds)
    print(f"Created {len(grounds)} grounds")

    slots = []
    slot_id_counter = 1
    today = datetime.now(timezone.utc).date()
    for g in grounds:
        for day_offset in range(7):
            slot_date = today + timedelta(days=day_offset)
            for hour in [6,7,8,9,10]:
                slots.append((f"slot{slot_id_counter}", g[0], slot_date.isoformat(), f"{hour:02d}:00", f"{hour+1:02d}:00", 1000, 0))
                slot_id_counter += 1
            for hour in [16,17,18,19,20]:
                slots.append((f"slot{slot_id_counter}", g[0], slot_date.isoformat(), f"{hour:02d}:00", f"{hour+1:02d}:00", 1500, 0))
                slot_id_counter += 1
    cur.executemany("INSERT INTO slots (id, ground_id, slot_date, start_time, end_time, price, is_booked) VALUES (?, ?, ?, ?, ?, ?, ?)", slots)
    print(f"Created {len(slots)} slots")

    conn.commit()
    conn.close()
    print("\n=== Seed data completed ===")
    print(f"Owner credentials: {owner_email} / password123")
    print(f"Player credentials: {player_email} / password123")

if __name__ == "__main__":
    seed_database()

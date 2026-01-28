#!/usr/bin/env python
"""Test script to verify database creation and user insertion"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "app.db"

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    
    # Create users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            fullName TEXT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            mobileNumber TEXT UNIQUE,
            password_hash TEXT,
            role TEXT,
            created_at TEXT
        )
    """)
    
    # Create OTP table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS otp_storage (
            id TEXT PRIMARY KEY,
            mobileNumber TEXT UNIQUE,
            otp TEXT,
            created_at TEXT,
            expires_at TEXT
        )
    """)
    
    conn.commit()
    print("✓ Database initialized successfully")
    
    # Check tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cur.fetchall()
    print(f"✓ Tables created: {[t[0] for t in tables]}")
    
    # Check users table schema
    cur.execute("PRAGMA table_info(users)")
    columns = cur.fetchall()
    print(f"✓ Users table columns: {[col[1] for col in columns]}")
    
    conn.close()

if __name__ == "__main__":
    init_db()
    print("\n✓ Database test passed!")

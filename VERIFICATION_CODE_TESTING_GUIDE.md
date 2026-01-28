# Verification Code System - Testing Guide

## System Overview

The verification code system has been fully implemented and deployed. Here's how to test it:

## Test Scenario: Complete Workflow

### Step 1: Register a Player Account
1. Go to `http://localhost:3000/register`
2. Fill in details:
   - Full Name: `Test Player`
   - Username: `testplayer123`
   - Email: `test@example.com`
   - Mobile Number: `9876543210`
   - Password: `Test@123`
   - Role: `Player`
3. Click "Register"
4. **Expected Result**: Page shows a large red 6-digit verification code with a copy button
5. **Example Code**: `342891` (or any 6 random digits)
6. Copy this code - you'll need it later!

### Step 2: Create a Booking (Optional - for testing verification)
1. Login as the player you just created
2. Go to "My Bookings" or search for available venues
3. Create a booking for a ground slot
4. **Expected Result**: Booking appears in your bookings list with status "pending"

### Step 3: View Your Code in Bookings
1. Go to "My Bookings" page
2. At the top, you should see a section showing:
   - "🔐 Your Verification Code (Show this when you visit the ground)"
   - Your 6-digit code in large red font
   - Copy button
3. **Expected Result**: Code matches what you got during registration

### Step 4: Owner Verifies the Code
**Note**: For this step, you need an owner account. Create one if needed.

1. Login as an owner account
2. Go to Owner Dashboard → "Verify Booking" (or navigate to `/owner/verify-booking`)
3. Enter the 6-digit code from the player
4. Click "Verify Code"
5. **Expected Result**: The page displays:
   - Player name
   - Player email
   - Player mobile number
   - List of all pending bookings with:
     - Venue name
     - Ground name
     - Date
     - Time (start and end)
     - Price
   - **Total amount** in a gold box (sum of all booking prices)
6. Click "✓ Confirm Verification"
7. **Expected Result**: Success message shows "Verified X booking(s) for [Player Name]"

### Step 5: Verify Status Update
The booking status should now be:
- Changed from `pending` to `verified`
- `verified_at` timestamp added to the database

## Code Details

### Backend Endpoints

#### 1. Register Player
```
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test Player",
  "username": "testplayer123",
  "email": "test@example.com",
  "mobileNumber": "9876543210",
  "password": "Test@123",
  "role": "player"
}
```

**Success Response (200)**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "username": "testplayer123",
    "email": "test@example.com",
    "mobileNumber": "9876543210",
    "role": "player",
    "verification_code": "342891",
    "created_at": "2026-01-28T13:31:57.123456+00:00"
  }
}
```

#### 2. Verify Code (Owner)
```
POST http://localhost:8000/api/bookings/verify-code
Content-Type: application/json

{
  "verification_code": "342891"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "player_name": "Test Player",
  "player_email": "test@example.com",
  "mobile_number": "9876543210",
  "bookings": [
    {
      "booking_id": "1706432400.0",
      "date": "2026-02-01",
      "start_time": "10:00",
      "end_time": "11:00",
      "price": 500,
      "venue": "Sports Complex",
      "ground": "Cricket Ground"
    }
  ],
  "total_amount": 500
}
```

**Error Response (404)**: Invalid verification code or no pending bookings

#### 3. Confirm Verification (Owner)
```
POST http://localhost:8000/api/bookings/confirm-verification
Content-Type: application/json

{
  "verification_code": "342891"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Verified 1 booking(s) for Test Player",
  "verified_count": 1
}
```

## Technical Implementation

### Frontend Components

#### Register.js
- Accepts registration form with mobile number
- Calls `/api/auth/register`
- On success, displays verification code instead of redirecting
- Code shown in 36px red bold monospace font
- Copy button uses `navigator.clipboard.writeText()`

#### MyBookings.js
- Added section at top showing player's verification code
- Amber background with dashed gold border
- Displays code from `user?.verification_code`
- Copy button for easy sharing at ground location

#### VerifyBooking.js (NEW)
- Form accepts 6-digit code
- On submit, calls `/api/bookings/verify-code`
- Displays player info in styled boxes
- Shows booking list with venue, ground, date, time, price
- Calculates and displays total amount
- Confirm button calls `/api/bookings/confirm-verification`

### Backend Models

```python
class UserResponse(BaseModel):
    username: str
    email: str
    mobileNumber: str
    role: str
    verification_code: str
    created_at: str

class VerifyCodeRequest(BaseModel):
    verification_code: str

class VerifyCodeResponse(BaseModel):
    success: bool
    player_name: str
    player_email: str
    mobile_number: str
    bookings: List[dict]
    total_amount: int
```

### Database Updates

**Users Table**:
- Added `verification_code TEXT UNIQUE` column
- Generated during registration
- Used to look up player for verification

**Bookings Table**:
- Added `status TEXT DEFAULT 'pending'` column
- Added `verified_at TEXT` column
- Status changes from 'pending' to 'verified' when owner confirms
- Only verified bookings count toward owner revenue

## Testing with cURL

### Test 1: Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Player",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "mobileNumber": "9876543210",
    "password": "Test@123",
    "role": "player"
  }'
```

### Test 2: Verify Code
```bash
curl -X POST http://localhost:8000/api/bookings/verify-code \
  -H "Content-Type: application/json" \
  -d '{"verification_code": "342891"}'
```

### Test 3: Confirm Verification
```bash
curl -X POST http://localhost:8000/api/bookings/confirm-verification \
  -H "Content-Type: application/json" \
  -d '{"verification_code": "342891"}'
```

## Expected Behaviors

### Registration
✓ Generates unique 6-digit code (000000-999999)
✓ Code is UNIQUE - no duplicates
✓ Code returned in registration response
✓ Code stored in users table

### Verification
✓ Owner can input 6-digit code
✓ System finds matching player
✓ Shows all pending bookings for that player
✓ Calculates total amount across bookings
✓ Owner confirms verification
✓ All pending bookings marked as "verified"

### Revenue
✓ Only "verified" bookings count
✓ Revenue updates after confirmation
✓ Previous bookings remain unchanged

## Troubleshooting

### Issue: Code not showing after registration
- Check if registration response includes `verification_code` field
- Verify `UserResponse` model includes the field
- Check backend logs: `docker compose logs backend`

### Issue: Verify Booking page not loading
- Confirm you're logged in as owner
- Check route: should be `/owner/verify-booking`
- Check browser console for errors (F12)

### Issue: "Invalid verification code" error
- Ensure code is exactly 6 digits
- Code should match what player received during registration
- Player must have pending bookings to verify

### Issue: Bookings not showing as verified
- Check database: `SELECT * FROM bookings WHERE id=...;`
- Verify `status` column was updated to "verified"
- Check `verified_at` timestamp was set

## Database Queries

### Check user's verification code
```sql
SELECT username, email, verification_code FROM users WHERE email='test@example.com';
```

### Check booking statuses
```sql
SELECT id, user_id, status, booked_at, verified_at FROM bookings WHERE user_id='...';
```

### Count pending bookings
```sql
SELECT COUNT(*) FROM bookings WHERE status='pending';
```

### Count verified bookings
```sql
SELECT COUNT(*) FROM bookings WHERE status='verified';
```

## Success Criteria

✓ Players receive unique 6-digit codes on registration
✓ Codes display in player's bookings page
✓ Owners can input codes on verify-booking page
✓ System shows correct player info and booking details
✓ Total amount calculated correctly
✓ Bookings marked as verified after confirmation
✓ Revenue only includes verified bookings

## Next Steps

1. Test complete registration to verification workflow
2. Verify unique code generation works
3. Test with multiple players and bookings
4. Verify database updates correctly
5. Check revenue calculation in analytics
6. Test edge cases (duplicate codes, invalid codes, no bookings)

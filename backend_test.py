import requests
import sys
from datetime import datetime, timedelta
import json

class BoxGamesAPITester:
    def __init__(self, base_url="https://sportsbooker-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.player_token = None
        self.owner_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_authentication(self):
        """Test user authentication"""
        print("\n🔐 Testing Authentication...")
        
        # Test player login
        success, response = self.run_test(
            "Player Login",
            "POST",
            "auth/login",
            200,
            data={"email": "player@boxgames.com", "password": "password123"}
        )
        if success and 'access_token' in response:
            self.player_token = response['access_token']
            self.log_test("Player Token Retrieved", True)
        else:
            self.log_test("Player Token Retrieved", False, "No token in response")

        # Test owner login
        success, response = self.run_test(
            "Owner Login",
            "POST",
            "auth/login",
            200,
            data={"email": "owner@boxgames.com", "password": "password123"}
        )
        if success and 'access_token' in response:
            self.owner_token = response['access_token']
            self.log_test("Owner Token Retrieved", True)
        else:
            self.log_test("Owner Token Retrieved", False, "No token in response")

        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )

        # Test user registration
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "username": "testuser",
                "email": test_email,
                "password": "testpass123",
                "role": "player"
            }
        )

    def test_player_endpoints(self):
        """Test player-specific endpoints"""
        print("\n🏟️ Testing Player Endpoints...")
        
        if not self.player_token:
            print("❌ Skipping player tests - no token available")
            return

        headers = {"Authorization": f"Bearer {self.player_token}"}

        # Test get venues
        success, venues = self.run_test(
            "Get Venues",
            "GET",
            "venues",
            200
        )

        if success and venues:
            venue_id = venues[0]['id']
            
            # Test get venue details
            self.run_test(
                "Get Venue Details",
                "GET",
                f"venues/{venue_id}",
                200
            )

            # Test get venue grounds
            success, grounds = self.run_test(
                "Get Venue Grounds",
                "GET",
                f"venues/{venue_id}/grounds",
                200
            )

            if success and grounds:
                ground_id = grounds[0]['id']
                
                # Test get ground slots
                today = datetime.now().strftime('%Y-%m-%d')
                success, slots = self.run_test(
                    "Get Ground Slots",
                    "GET",
                    f"grounds/{ground_id}/slots?slot_date={today}",
                    200
                )

                # Test booking creation
                if success and slots:
                    available_slot = next((slot for slot in slots if not slot['is_booked']), None)
                    if available_slot:
                        success, booking = self.run_test(
                            "Create Booking",
                            "POST",
                            "bookings",
                            200,
                            data={"slot_id": available_slot['id']},
                            headers=headers
                        )

                        if success:
                            booking_id = booking['id']
                            
                            # Test get my bookings
                            self.run_test(
                                "Get My Bookings",
                                "GET",
                                "bookings/my",
                                200,
                                headers=headers
                            )

                            # Test booking cancellation (should fail due to 1-hour rule)
                            self.run_test(
                                "Cancel Booking (Should Fail)",
                                "DELETE",
                                f"bookings/{booking_id}",
                                400,
                                headers=headers
                            )

        # Test protected endpoint without token
        self.run_test(
            "Protected Endpoint Without Token",
            "GET",
            "bookings/my",
            401
        )

    def test_owner_endpoints(self):
        """Test owner-specific endpoints"""
        print("\n👑 Testing Owner Endpoints...")
        
        if not self.owner_token:
            print("❌ Skipping owner tests - no token available")
            return

        headers = {"Authorization": f"Bearer {self.owner_token}"}

        # Test owner dashboard
        self.run_test(
            "Owner Dashboard",
            "GET",
            "owner/dashboard",
            200,
            headers=headers
        )

        # Test get owner venues
        success, venues = self.run_test(
            "Get Owner Venues",
            "GET",
            "owner/venues",
            200,
            headers=headers
        )

        # Test get owner grounds
        self.run_test(
            "Get Owner Grounds",
            "GET",
            "owner/grounds",
            200,
            headers=headers
        )

        # Test owner analytics
        self.run_test(
            "Owner Analytics",
            "GET",
            "owner/analytics",
            200,
            headers=headers
        )

        # Test venue creation
        test_venue_name = f"Test Venue {datetime.now().strftime('%H%M%S')}"
        success, venue = self.run_test(
            "Create Venue",
            "POST",
            "owner/venues",
            200,
            data={
                "name": test_venue_name,
                "location": "Test Location",
                "image_url": "https://example.com/test.jpg"
            },
            headers=headers
        )

        if success:
            venue_id = venue['id']
            
            # Test ground creation
            success, ground = self.run_test(
                "Create Ground",
                "POST",
                "owner/grounds",
                200,
                data={
                    "name": "Test Ground",
                    "venue_id": venue_id
                },
                headers=headers
            )

            if success:
                ground_id = ground['id']
                
                # Test slot creation
                tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                self.run_test(
                    "Create Slot",
                    "POST",
                    "owner/slots",
                    200,
                    data={
                        "ground_id": ground_id,
                        "slot_date": tomorrow,
                        "start_time": "10:00",
                        "end_time": "11:00",
                        "price": 1200
                    },
                    headers=headers
                )

                # Test ground deletion
                self.run_test(
                    "Delete Ground",
                    "DELETE",
                    f"owner/grounds/{ground_id}",
                    200,
                    headers=headers
                )

            # Test venue deletion
            self.run_test(
                "Delete Venue",
                "DELETE",
                f"owner/venues/{venue_id}",
                200,
                headers=headers
            )

        # Test unauthorized access (player trying owner endpoints)
        player_headers = {"Authorization": f"Bearer {self.player_token}"} if self.player_token else {}
        if self.player_token:
            self.run_test(
                "Unauthorized Owner Access",
                "GET",
                "owner/dashboard",
                403,
                headers=player_headers
            )

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n⚠️ Testing Edge Cases...")
        
        # Test non-existent venue
        self.run_test(
            "Non-existent Venue",
            "GET",
            "venues/nonexistent",
            404
        )

        # Test invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        self.run_test(
            "Invalid Token",
            "GET",
            "auth/me",
            401,
            headers=invalid_headers
        )

        # Test double booking (if we have tokens)
        if self.player_token:
            headers = {"Authorization": f"Bearer {self.player_token}"}
            
            # Get a slot and try to book it twice
            success, venues = self.run_test(
                "Get Venues for Double Booking Test",
                "GET",
                "venues",
                200
            )
            
            if success and venues:
                venue_id = venues[0]['id']
                success, grounds = self.run_test(
                    "Get Grounds for Double Booking Test",
                    "GET",
                    f"venues/{venue_id}/grounds",
                    200
                )
                
                if success and grounds:
                    ground_id = grounds[0]['id']
                    today = datetime.now().strftime('%Y-%m-%d')
                    success, slots = self.run_test(
                        "Get Slots for Double Booking Test",
                        "GET",
                        f"grounds/{ground_id}/slots?slot_date={today}",
                        200
                    )
                    
                    if success and slots:
                        available_slot = next((slot for slot in slots if not slot['is_booked']), None)
                        if available_slot:
                            # First booking should succeed
                            success, _ = self.run_test(
                                "First Booking",
                                "POST",
                                "bookings",
                                200,
                                data={"slot_id": available_slot['id']},
                                headers=headers
                            )
                            
                            # Second booking should fail
                            self.run_test(
                                "Double Booking (Should Fail)",
                                "POST",
                                "bookings",
                                400,
                                data={"slot_id": available_slot['id']},
                                headers=headers
                            )

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting BoxGames API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_authentication()
        self.test_player_endpoints()
        self.test_owner_endpoints()
        self.test_edge_cases()
        
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        # Return detailed results
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "detailed_results": self.test_results
        }

def main():
    tester = BoxGamesAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results["passed_tests"] == results["total_tests"] else 1

if __name__ == "__main__":
    sys.exit(main())
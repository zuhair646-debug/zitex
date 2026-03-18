import requests
import sys
from datetime import datetime
import time

class ZitexAPITester:
    def __init__(self, base_url="https://ai-website-builder-49.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response Text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test User",
                "country": "SA"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            return True, response['user']
        return False, None

    def test_admin_login(self):
        """Test admin login with owner credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "owner@zitex.com",
                "password": "owner123"
            }
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True, response['user']
        return False, None

    def test_get_me(self, token_type="user"):
        """Test get current user info"""
        token = self.admin_token if token_type == "admin" else self.token
        if not token:
            print("❌ No token available for get_me test")
            return False, None
            
        success, response = self.run_test(
            f"Get Me ({token_type})",
            "GET",
            "auth/me",
            200,
            headers={"Authorization": f"Bearer {token}"}
        )
        return success, response

    def test_pricing(self):
        """Test pricing endpoint"""
        success, response = self.run_test(
            "Get Pricing",
            "GET",
            "pricing",
            200
        )
        return success, response

    def test_payment_settings(self):
        """Test payment settings endpoint"""
        success, response = self.run_test(
            "Get Payment Settings",
            "GET",
            "settings/payment",
            200
        )
        return success, response

    def test_admin_stats(self):
        """Test admin stats (requires admin token)"""
        if not self.admin_token:
            print("❌ No admin token available for stats test")
            return False, None
            
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success, response

    def test_admin_users(self):
        """Test admin users list (requires admin token)"""
        if not self.admin_token:
            print("❌ No admin token available for users test")
            return False, None
            
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "admin/users",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success, response

    def test_create_website_request(self):
        """Test creating a website request"""
        if not self.token:
            print("❌ No user token available for website request test")
            return False, None
            
        success, response = self.run_test(
            "Create Website Request",
            "POST",
            "requests/create",
            200,
            data={
                "title": "Test Website",
                "description": "موقع تجريبي للاختبار",
                "requirements": "موقع بسيط مع صفحة واحدة",
                "business_type": "تجريبي",
                "target_audience": "عام",
                "preferred_colors": "أزرق وأبيض"
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )
        return success, response

    def test_add_credits_to_user(self, user_id, credits=100):
        """Add credits to user (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available for adding credits")
            return False, None
            
        success, response = self.run_test(
            "Add Credits to User",
            "PUT",
            f"admin/users/{user_id}/add-credits?credits={credits}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success, response

    def test_image_generation_without_subscription(self):
        """Test image generation without subscription (should fail)"""
        if not self.token:
            print("❌ No user token available for image generation test")
            return False, None
            
        # Use query parameter instead of JSON body
        success, response = self.run_test(
            "Image Generation (No Subscription)",
            "POST",
            "generate/image?prompt=A beautiful sunset",
            403,  # Should fail with 403
            headers={"Authorization": f"Bearer {self.token}"}
        )
        return success, response

    def test_video_generation_without_subscription(self):
        """Test video generation without subscription (should fail)"""
        if not self.token:
            print("❌ No user token available for video generation test")
            return False, None
            
        # Use query parameter instead of JSON body
        success, response = self.run_test(
            "Video Generation (No Subscription)",
            "POST",
            "generate/video?prompt=A short animation",
            403,  # Should fail with 403
            headers={"Authorization": f"Bearer {self.token}"}
        )
        return success, response

def main():
    print("🚀 Starting Zitex API Tests...")
    tester = ZitexAPITester()

    # Test public endpoints first
    print("\n=== TESTING PUBLIC ENDPOINTS ===")
    tester.test_pricing()
    tester.test_payment_settings()

    # Test user registration and authentication
    print("\n=== TESTING USER AUTHENTICATION ===")
    reg_success, user_data = tester.test_register()
    if reg_success:
        print(f"✅ User registered: {user_data.get('email', 'N/A')}")
        tester.test_get_me("user")
    
    # Test admin login
    print("\n=== TESTING ADMIN AUTHENTICATION ===")
    admin_success, admin_data = tester.test_admin_login()
    if admin_success:
        print(f"✅ Admin logged in: {admin_data.get('email', 'N/A')}")
        print(f"Admin role: {admin_data.get('role', 'N/A')}")
        print(f"Is owner: {admin_data.get('is_owner', 'N/A')}")
        tester.test_get_me("admin")

    # Test admin endpoints
    print("\n=== TESTING ADMIN ENDPOINTS ===")
    if admin_success:
        tester.test_admin_stats()
        tester.test_admin_users()

    # Test user features
    print("\n=== TESTING USER FEATURES ===")
    if reg_success:
        # Add credits to user first if admin login was successful
        if admin_success and user_data:
            user_id = user_data.get('id')
            if user_id:
                credit_success, _ = tester.test_add_credits_to_user(user_id, 100)
                if credit_success:
                    print("✅ Credits added to user")
        
        # Test website request 
        req_success, req_data = tester.test_create_website_request()
        
        # Test image/video generation (should fail without subscription)
        tester.test_image_generation_without_subscription()
        tester.test_video_generation_without_subscription()

    # Print final results
    print(f"\n📊 Final Results:")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {tester.tests_passed/tester.tests_run*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
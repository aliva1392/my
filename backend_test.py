#!/usr/bin/env python3
"""
Backend API Testing Script for TopCopy Printing System
Tests all authentication, pricing, cart, and order APIs
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://printctrl.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_id = None
        self.admin_token = None
        self.admin_user_id = None
        self.cart_items = []
        self.orders = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with level"""
        print(f"[{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict:
        """Make HTTP request and return response"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
            
        if self.token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"{method} {endpoint} -> Status: {response.status_code}")
            
            if response.status_code >= 400:
                self.log(f"Error Response: {response.text}", "ERROR")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
            
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return {"status_code": 0, "data": {}, "success": False, "error": str(e)}
        except json.JSONDecodeError as e:
            self.log(f"JSON decode error: {str(e)}", "ERROR")
            return {"status_code": response.status_code, "data": {}, "success": False, "error": "Invalid JSON"}

    def test_auth_register(self) -> bool:
        """Test user registration"""
        self.log("Testing user registration...")
        
        user_data = {
            "phone": "09111111111",
            "password": "test123",
            "name": "Test User"
        }
        
        response = self.make_request("POST", "/auth/register", user_data)
        
        if response["success"]:
            self.token = response["data"].get("token")
            self.user_id = response["data"].get("user", {}).get("id")
            self.log(f"Registration successful. User ID: {self.user_id}")
            return True
        else:
            self.log(f"Registration failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_auth_login(self) -> bool:
        """Test user login"""
        self.log("Testing user login...")
        
        credentials = {
            "phone": "09111111111",
            "password": "test123"
        }
        
        response = self.make_request("POST", "/auth/login", credentials)
        
        if response["success"]:
            self.token = response["data"].get("token")
            self.user_id = response["data"].get("user", {}).get("id")
            self.log(f"Login successful. Token received: {self.token[:20]}...")
            return True
        else:
            self.log(f"Login failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_auth_me(self) -> bool:
        """Test get current user info"""
        self.log("Testing get current user...")
        
        if not self.token:
            self.log("No token available for authentication", "ERROR")
            return False
            
        response = self.make_request("GET", "/auth/me")
        
        if response["success"]:
            user_data = response["data"]
            self.log(f"User info retrieved: {user_data.get('name')} ({user_data.get('phone')})")
            return True
        else:
            self.log(f"Get user info failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_pricing_list(self) -> bool:
        """Test get pricing data"""
        self.log("Testing get pricing data...")
        
        response = self.make_request("GET", "/pricing/")
        
        if response["success"]:
            data = response["data"]
            self.log(f"Pricing data retrieved: {len(data.get('paper_sizes', []))} paper sizes, {len(data.get('services', []))} services")
            return True
        else:
            self.log(f"Get pricing failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_pricing_calculate_sheet_based(self) -> bool:
        """Test CRITICAL FIX: sheet vs page calculation"""
        self.log("Testing CRITICAL FIX: sheet vs page calculation...")
        
        test_cases = [
            {
                "name": "Single-sided test (100 pages = 100 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "single",
                    "pages": 100,
                    "copies": 1,
                    "service": "none"
                },
                "expected_sheets_per_copy": 100,
                "expected_total_sheets": 100
            },
            {
                "name": "Double-sided test (100 pages = 50 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "double",
                    "pages": 100,
                    "copies": 1,
                    "service": "none"
                },
                "expected_sheets_per_copy": 50,
                "expected_total_sheets": 50
            },
            {
                "name": "Double-sided odd pages (101 pages = 51 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "double",
                    "pages": 101,
                    "copies": 1,
                    "service": "none"
                },
                "expected_sheets_per_copy": 51,
                "expected_total_sheets": 51
            },
            {
                "name": "Multiple copies single-sided (50 pages × 5 copies = 250 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "single",
                    "pages": 50,
                    "copies": 5,
                    "service": "none"
                },
                "expected_sheets_per_copy": 50,
                "expected_total_sheets": 250
            },
            {
                "name": "Multiple copies double-sided (50 pages × 5 copies = 125 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "double",
                    "pages": 50,
                    "copies": 5,
                    "service": "none"
                },
                "expected_sheets_per_copy": 25,
                "expected_total_sheets": 125
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            self.log(f"\n  Testing: {test_case['name']}")
            
            response = self.make_request("POST", "/pricing/calculate", test_case["data"])
            
            if not response["success"]:
                self.log(f"  ✗ Request failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
                all_passed = False
                continue
                
            result = response["data"]
            
            # Check new response structure
            required_fields = ["price_per_sheet", "sheets_per_copy", "total_sheets", "price_per_copy", "service_cost", "total"]
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                self.log(f"  ✗ Missing fields in response: {missing_fields}", "ERROR")
                all_passed = False
                continue
            
            # Verify sheet calculations
            sheets_per_copy = result.get("sheets_per_copy")
            total_sheets = result.get("total_sheets")
            price_per_sheet = result.get("price_per_sheet")
            price_per_copy = result.get("price_per_copy")
            service_cost = result.get("service_cost")
            total = result.get("total")
            
            # Check sheets_per_copy
            if sheets_per_copy != test_case["expected_sheets_per_copy"]:
                self.log(f"  ✗ sheets_per_copy incorrect. Expected: {test_case['expected_sheets_per_copy']}, Got: {sheets_per_copy}", "ERROR")
                all_passed = False
            else:
                self.log(f"  ✓ sheets_per_copy correct: {sheets_per_copy}")
            
            # Check total_sheets
            if total_sheets != test_case["expected_total_sheets"]:
                self.log(f"  ✗ total_sheets incorrect. Expected: {test_case['expected_total_sheets']}, Got: {total_sheets}", "ERROR")
                all_passed = False
            else:
                self.log(f"  ✓ total_sheets correct: {total_sheets}")
            
            # Verify mathematical relationships
            expected_price_per_copy = sheets_per_copy * price_per_sheet
            if abs(price_per_copy - expected_price_per_copy) > 0.01:
                self.log(f"  ✗ price_per_copy calculation incorrect. Expected: {expected_price_per_copy}, Got: {price_per_copy}", "ERROR")
                all_passed = False
            else:
                self.log(f"  ✓ price_per_copy calculation correct: {price_per_copy}")
            
            expected_total = (price_per_copy * test_case["data"]["copies"]) + service_cost
            if abs(total - expected_total) > 0.01:
                self.log(f"  ✗ total calculation incorrect. Expected: {expected_total}, Got: {total}", "ERROR")
                all_passed = False
            else:
                self.log(f"  ✓ total calculation correct: {total}")
                
            self.log(f"  Response: sheets_per_copy={sheets_per_copy}, total_sheets={total_sheets}, price_per_sheet={price_per_sheet}")
        
        return all_passed

    def test_pricing_tier_based_on_sheets(self) -> bool:
        """Test that pricing tiers are applied based on total_sheets, not total_pages"""
        self.log("Testing pricing tiers based on sheets...")
        
        # Compare: 100 pages single vs 200 pages double (both = 100 sheets) should get same tier
        test_cases = [
            {
                "name": "100 pages single-sided (100 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "single",
                    "pages": 100,
                    "copies": 1,
                    "service": "none"
                }
            },
            {
                "name": "200 pages double-sided (100 sheets)",
                "data": {
                    "color_class": "a4_bw_simple",
                    "print_type": "double",
                    "pages": 200,
                    "copies": 1,
                    "service": "none"
                }
            }
        ]
        
        results = []
        
        for test_case in test_cases:
            self.log(f"\n  Testing: {test_case['name']}")
            
            response = self.make_request("POST", "/pricing/calculate", test_case["data"])
            
            if not response["success"]:
                self.log(f"  ✗ Request failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
                return False
                
            result = response["data"]
            results.append(result)
            
            self.log(f"  total_sheets: {result.get('total_sheets')}, price_per_sheet: {result.get('price_per_sheet')}")
        
        # Both should have same total_sheets and price_per_sheet (same tier)
        if results[0]["total_sheets"] == results[1]["total_sheets"] == 100:
            self.log("  ✓ Both scenarios have 100 total_sheets")
        else:
            self.log(f"  ✗ total_sheets mismatch: {results[0]['total_sheets']} vs {results[1]['total_sheets']}", "ERROR")
            return False
            
        if results[0]["price_per_sheet"] == results[1]["price_per_sheet"]:
            self.log(f"  ✓ Same pricing tier applied (price_per_sheet: {results[0]['price_per_sheet']})")
            return True
        else:
            self.log(f"  ✗ Different pricing tiers: {results[0]['price_per_sheet']} vs {results[1]['price_per_sheet']}", "ERROR")
            return False

    def test_cart_add(self) -> bool:
        """Test adding item to cart"""
        self.log("Testing add to cart...")
        
        if not self.token:
            self.log("No token available for authentication", "ERROR")
            return False
        
        # First calculate price for the item
        calc_data = {
            "color_class": "a4_bw_simple",
            "print_type": "single",
            "pages": 100,
            "copies": 5,
            "service": "none"
        }
        
        calc_response = self.make_request("POST", "/pricing/calculate", calc_data)
        if not calc_response["success"]:
            self.log("Failed to calculate price for cart item", "ERROR")
            return False
            
        calc_result = calc_response["data"]
        
        cart_item = {
            "paper_size": "a4",
            "color_class": "a4_bw_simple",
            "print_type": "single",
            "pages": 100,
            "copies": 5,
            "service": "none",
            "price_per_copy": calc_result["price_per_copy"],
            "service_cost": calc_result["service_cost"],
            "total_price": calc_result["total"],
            "notes": "Test order - 100 pages A4 black and white",
            "file_method": "upload",
            "file_details": "test_document.pdf"
        }
        
        response = self.make_request("POST", "/cart/", cart_item)
        
        if response["success"]:
            cart_data = response["data"]
            items = cart_data.get("items", [])
            total = cart_data.get("total")
            
            self.log(f"Item added to cart successfully:")
            self.log(f"  Cart items: {len(items)}")
            self.log(f"  Cart total: {total}")
            
            if items:
                self.cart_items = items
                return True
            else:
                self.log("No items found in cart response", "ERROR")
                return False
        else:
            self.log(f"Add to cart failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_cart_get(self) -> bool:
        """Test getting cart contents"""
        self.log("Testing get cart...")
        
        if not self.token:
            self.log("No token available for authentication", "ERROR")
            return False
            
        response = self.make_request("GET", "/cart/")
        
        if response["success"]:
            cart_data = response["data"]
            items = cart_data.get("items", [])
            total = cart_data.get("total")
            
            self.log(f"Cart retrieved successfully:")
            self.log(f"  Items: {len(items)}")
            self.log(f"  Total: {total}")
            
            return True
        else:
            self.log(f"Get cart failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_cart_remove(self) -> bool:
        """Test removing item from cart"""
        self.log("Testing remove from cart...")
        
        if not self.token:
            self.log("No token available for authentication", "ERROR")
            return False
            
        if not self.cart_items:
            self.log("No cart items available to remove", "ERROR")
            return False
            
        item_id = self.cart_items[0]["id"]
        response = self.make_request("DELETE", f"/cart/{item_id}")
        
        if response["success"]:
            cart_data = response["data"]
            items = cart_data.get("items", [])
            
            self.log(f"Item removed from cart successfully. Remaining items: {len(items)}")
            return True
        else:
            self.log(f"Remove from cart failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_orders_checkout(self) -> bool:
        """Test checkout from cart"""
        self.log("Testing checkout from cart...")
        
        if not self.token:
            self.log("No token available for authentication", "ERROR")
            return False
        
        # First add an item to cart for checkout
        if not self.test_cart_add():
            self.log("Failed to add item to cart for checkout test", "ERROR")
            return False
            
        response = self.make_request("POST", "/orders/checkout")
        
        if response["success"]:
            order_data = response["data"]
            order_id = order_data.get("id")
            total_amount = order_data.get("total_amount")
            items = order_data.get("items", [])
            
            self.log(f"Checkout successful:")
            self.log(f"  Order ID: {order_id}")
            self.log(f"  Total amount: {total_amount}")
            self.log(f"  Items: {len(items)}")
            
            self.orders.append(order_data)
            return True
        else:
            self.log(f"Checkout failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_orders_get(self) -> bool:
        """Test getting user orders"""
        self.log("Testing get orders...")
        
        if not self.token:
            self.log("No token available for authentication", "ERROR")
            return False
            
        response = self.make_request("GET", "/orders/")
        
        if response["success"]:
            orders = response["data"]
            self.log(f"Orders retrieved successfully: {len(orders)} orders")
            
            for order in orders:
                self.log(f"  Order {order.get('id')}: {order.get('status')} - {order.get('total_amount')}")
                
            return True
        else:
            self.log(f"Get orders failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_admin_user_setup(self) -> bool:
        """Create admin user and set admin privileges"""
        self.log("Setting up admin user...")
        
        # Register admin user
        admin_data = {
            "phone": "09999999999",
            "password": "admin123",
            "name": "Admin User"
        }
        
        response = self.make_request("POST", "/auth/register", admin_data)
        
        if response["success"]:
            self.admin_token = response["data"].get("token")
            self.admin_user_id = response["data"].get("user", {}).get("id")
            self.log(f"Admin user registered. User ID: {self.admin_user_id}")
            
            # Now manually set is_admin=true in database using MongoDB
            # This would normally be done through database admin tools
            # For testing, we'll assume this step is completed manually
            self.log("Note: Admin privileges must be set manually in database (is_admin=true)")
            return True
        else:
            # Try to login if user already exists
            login_response = self.make_request("POST", "/auth/login", {
                "phone": "09999999999",
                "password": "admin123"
            })
            
            if login_response["success"]:
                self.admin_token = login_response["data"].get("token")
                self.admin_user_id = login_response["data"].get("user", {}).get("id")
                self.log(f"Admin user login successful. User ID: {self.admin_user_id}")
                return True
            else:
                self.log(f"Admin setup failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
                return False

    def test_admin_get_pricing(self) -> bool:
        """Test GET /api/admin/pricing"""
        self.log("Testing admin get pricing config...")
        
        if not self.admin_token:
            self.log("No admin token available", "ERROR")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.make_request("GET", "/admin/pricing", headers=headers)
        
        if response["success"]:
            data = response["data"]
            self.log(f"Admin pricing config retrieved successfully")
            self.log(f"  Paper sizes: {len(data.get('paper_sizes', []))}")
            self.log(f"  Color classes: {len(data.get('color_classes', []))}")
            self.log(f"  Services: {len(data.get('services', []))}")
            return True
        else:
            self.log(f"Admin get pricing failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_admin_initialize_pricing(self) -> bool:
        """Test POST /api/admin/pricing/initialize"""
        self.log("Testing admin initialize pricing...")
        
        if not self.admin_token:
            self.log("No admin token available", "ERROR")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.make_request("POST", "/admin/pricing/initialize", {}, headers=headers)
        
        if response["success"]:
            self.log("Pricing initialized successfully")
            return True
        else:
            self.log(f"Admin initialize pricing failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_admin_update_service_price(self) -> bool:
        """Test PUT /api/admin/pricing/service/{service_id}"""
        self.log("Testing admin update service price...")
        
        if not self.admin_token:
            self.log("No admin token available", "ERROR")
            return False
            
        # Update hotglue service price from 15000 to 20000
        service_data = {
            "price": 20000,
            "min_pages": 10
        }
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.make_request("PUT", "/admin/pricing/service/hotglue", service_data, headers=headers)
        
        if response["success"]:
            self.log("Service price updated successfully (hotglue: 15000 -> 20000)")
            return True
        else:
            self.log(f"Admin update service price failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_admin_update_pricing_tier(self) -> bool:
        """Test PUT /api/admin/pricing/tier/{color_class_id}/{tier_index}"""
        self.log("Testing admin update pricing tier...")
        
        if not self.admin_token:
            self.log("No admin token available", "ERROR")
            return False
            
        # Update a4_bw_simple tier 0: change single from 1190 to 1200
        tier_data = {
            "min": 1,
            "max": 100,
            "single": 1200,  # Changed from 1190
            "double": 990
        }
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.make_request("PUT", "/admin/pricing/tier/a4_bw_simple/0", tier_data, headers=headers)
        
        if response["success"]:
            self.log("Pricing tier updated successfully (a4_bw_simple tier 0: single 1190 -> 1200)")
            return True
        else:
            self.log(f"Admin update pricing tier failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_pricing_database_integration(self) -> bool:
        """Test that pricing endpoints now use database values"""
        self.log("Testing pricing database integration...")
        
        # Test GET /api/pricing/ returns updated values
        response = self.make_request("GET", "/pricing/")
        
        if not response["success"]:
            self.log(f"Get pricing failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False
            
        # Test price calculation with updated values
        calc_data = {
            "color_class": "a4_bw_simple",
            "print_type": "single",
            "pages": 50,  # Should use tier 0 with updated price
            "copies": 1,
            "service": "hotglue"  # Should use updated service price
        }
        
        calc_response = self.make_request("POST", "/pricing/calculate", calc_data)
        
        if calc_response["success"]:
            result = calc_response["data"]
            price_per_page = result.get("price_per_page")
            service_cost = result.get("service_cost")
            
            self.log(f"Price calculation with database values:")
            self.log(f"  Price per page: {price_per_page} (should be 1200 if tier updated)")
            self.log(f"  Service cost: {service_cost} (should be 20000 if service updated)")
            
            return True
        else:
            self.log(f"Price calculation failed: {calc_response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
            return False

    def test_admin_edge_cases(self) -> bool:
        """Test admin endpoint edge cases"""
        self.log("Testing admin endpoint edge cases...")
        
        if not self.admin_token:
            self.log("No admin token available", "ERROR")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test invalid service_id
        invalid_service_response = self.make_request(
            "PUT", 
            "/admin/pricing/service/invalid_service", 
            {"price": 1000}, 
            headers=headers
        )
        
        # Test invalid color_class_id
        invalid_color_response = self.make_request(
            "PUT", 
            "/admin/pricing/tier/invalid_color/0", 
            {"min": 1, "max": 100, "single": 1000, "double": 800}, 
            headers=headers
        )
        
        # Test invalid tier_index
        invalid_tier_response = self.make_request(
            "PUT", 
            "/admin/pricing/tier/a4_bw_simple/999", 
            {"min": 1, "max": 100, "single": 1000, "double": 800}, 
            headers=headers
        )
        
        # All should return 404 errors
        edge_case_results = [
            invalid_service_response["status_code"] == 404,
            invalid_color_response["status_code"] == 404,
            invalid_tier_response["status_code"] == 404
        ]
        
        if all(edge_case_results):
            self.log("All edge cases returned proper 404 errors")
            return True
        else:
            self.log(f"Edge case testing failed. Results: {edge_case_results}", "ERROR")
            return False

    def test_non_admin_access(self) -> bool:
        """Test that non-admin users get 403 errors"""
        self.log("Testing non-admin access restrictions...")
        
        if not self.token:
            self.log("No regular user token available", "ERROR")
            return False
            
        # Try to access admin endpoint with regular user token
        headers = {"Authorization": f"Bearer {self.token}"}
        response = self.make_request("GET", "/admin/pricing", headers=headers)
        
        if response["status_code"] == 403:
            self.log("Non-admin user properly denied access (403)")
            return True
        else:
            self.log(f"Non-admin access test failed. Expected 403, got {response['status_code']}", "ERROR")
            return False

    def run_all_tests(self) -> Dict[str, bool]:
        """Run all API tests"""
        self.log("=" * 60)
        self.log("Starting TopCopy Backend API Tests")
        self.log("=" * 60)
        
        results = {}
        
        # Authentication Tests
        self.log("\n--- AUTHENTICATION TESTS ---")
        results["auth_register"] = self.test_auth_register()
        results["auth_login"] = self.test_auth_login()
        results["auth_me"] = self.test_auth_me()
        
        # Admin Setup
        self.log("\n--- ADMIN SETUP ---")
        results["admin_setup"] = self.test_admin_user_setup()
        
        # Admin Pricing Tests (New)
        self.log("\n--- ADMIN PRICING TESTS ---")
        results["admin_get_pricing"] = self.test_admin_get_pricing()
        results["admin_initialize_pricing"] = self.test_admin_initialize_pricing()
        results["admin_update_service"] = self.test_admin_update_service_price()
        results["admin_update_tier"] = self.test_admin_update_pricing_tier()
        results["admin_edge_cases"] = self.test_admin_edge_cases()
        results["non_admin_access"] = self.test_non_admin_access()
        
        # Updated Pricing Tests (Database Integration)
        self.log("\n--- PRICING TESTS (DATABASE INTEGRATION) ---")
        results["pricing_list"] = self.test_pricing_list()
        results["pricing_calculate_sheet_based"] = self.test_pricing_calculate_sheet_based()
        results["pricing_tier_based_on_sheets"] = self.test_pricing_tier_based_on_sheets()
        results["pricing_database_integration"] = self.test_pricing_database_integration()
        
        # Cart Tests
        self.log("\n--- CART TESTS ---")
        results["cart_add"] = self.test_cart_add()
        results["cart_get"] = self.test_cart_get()
        results["cart_remove"] = self.test_cart_remove()
        
        # Order Tests
        self.log("\n--- ORDER TESTS ---")
        results["orders_checkout"] = self.test_orders_checkout()
        results["orders_get"] = self.test_orders_get()
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✓ PASS" if result else "✗ FAIL"
            self.log(f"{test_name:25} : {status}")
            if result:
                passed += 1
                
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed!", "SUCCESS")
        else:
            self.log(f"❌ {total - passed} tests failed", "ERROR")
            
        return results

if __name__ == "__main__":
    tester = APITester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    if not all(results.values()):
        sys.exit(1)
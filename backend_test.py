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

    def test_pricing_calculate(self) -> bool:
        """Test price calculation"""
        self.log("Testing price calculation...")
        
        # Test case: A4, سیاه سفید معمولی، تک رو، 100 صفحه، 5 سری
        calc_data = {
            "color_class": "a4_bw_simple",
            "print_type": "single",
            "pages": 100,
            "copies": 5,
            "service": "none"
        }
        
        response = self.make_request("POST", "/pricing/calculate", calc_data)
        
        if response["success"]:
            result = response["data"]
            total_pages = result.get("total_pages")
            price_per_page = result.get("price_per_page")
            total = result.get("total")
            
            self.log(f"Price calculation successful:")
            self.log(f"  Total pages: {total_pages}")
            self.log(f"  Price per page: {price_per_page}")
            self.log(f"  Total cost: {total}")
            
            # Verify calculation logic
            expected_total_pages = 100 * 5  # 500 pages
            if total_pages == expected_total_pages:
                self.log("✓ Total pages calculation correct")
                return True
            else:
                self.log(f"✗ Total pages calculation incorrect. Expected: {expected_total_pages}, Got: {total_pages}", "ERROR")
                return False
        else:
            self.log(f"Price calculation failed: {response.get('data', {}).get('detail', 'Unknown error')}", "ERROR")
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
        
        # Pricing Tests
        self.log("\n--- PRICING TESTS ---")
        results["pricing_list"] = self.test_pricing_list()
        results["pricing_calculate"] = self.test_pricing_calculate()
        
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
            self.log(f"{test_name:20} : {status}")
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
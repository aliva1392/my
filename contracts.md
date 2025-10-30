# Printing Order System - Contracts & Implementation Plan

## 1. API Contracts

### Authentication APIs
- **POST /api/auth/register**
  - Body: `{ phone: string, password: string, name?: string }`
  - Response: `{ user: {id, phone, name}, token: string }`

- **POST /api/auth/login**
  - Body: `{ phone: string, password: string }`
  - Response: `{ user: {id, phone, name}, token: string }`

- **GET /api/auth/me**
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user: {id, phone, name, cart: [], orders: []} }`

### Printing Order APIs
- **POST /api/orders**
  - Body: `{ paperSize, colorClass, printType, pages, copies, service, notes, fileMethod, fileDetails }`
  - Response: `{ order: {...}, message: "سفارش با موفقیت ثبت شد" }`

- **GET /api/orders**
  - Query: `?status=pending|completed|all`
  - Response: `{ orders: [...] }`

- **GET /api/orders/:id**
  - Response: `{ order: {...} }`

- **PUT /api/orders/:id**
  - Body: `{ pages, copies, service, notes }`
  - Response: `{ order: {...}, message: "سفارش ویرایش شد" }`

- **DELETE /api/orders/:id**
  - Response: `{ message: "سفارش حذف شد" }`

### Cart APIs
- **POST /api/cart**
  - Body: `{ paperSize, colorClass, printType, pages, copies, service, notes, fileMethod, fileDetails }`
  - Response: `{ cart: [...], message: "به سبد خرید اضافه شد" }`

- **GET /api/cart**
  - Response: `{ cart: [...], total: number }`

- **DELETE /api/cart/:itemId**
  - Response: `{ cart: [...], message: "از سبد خرید حذف شد" }`

- **POST /api/cart/checkout**
  - Response: `{ order: {...}, message: "سفارش با موفقیت ثبت شد" }`

### File Upload API
- **POST /api/upload**
  - Body: `FormData with file`
  - Response: `{ fileUrl: string, fileName: string }`

### Pricing API
- **GET /api/pricing**
  - Response: `{ paperSizes, colorClasses, printTypes, services, pricingTiers }`

- **POST /api/pricing/calculate**
  - Body: `{ colorClass, printType, totalPages, service }`
  - Response: `{ pricePerPage: number, serviceCost: number, total: number }`

## 2. Mock Data to Replace

### Frontend Mock Data (mockPricing.js)
Currently contains:
- `paperSizes` - will fetch from `/api/pricing`
- `colorClasses` - will fetch from `/api/pricing`
- `printTypes` - will fetch from `/api/pricing`
- `services` - will fetch from `/api/pricing`
- `pricingTiers` - will fetch from `/api/pricing`
- `calculatePrice()` - will call `/api/pricing/calculate`

### Frontend Component Updates
**Printing.jsx**:
- Replace local state `cart` with API calls to `/api/cart`
- Add authentication check
- Fetch pricing data from API on mount
- Replace `handleAddToCart()` to call `/api/cart`
- Replace `handleRemoveFromCart()` to call `/api/cart/:id`
- Add checkout handler to call `/api/cart/checkout`

## 3. Backend Implementation Plan

### Database Models

#### User Model
```python
{
  _id: ObjectId,
  phone: str,  # unique
  password: str,  # hashed
  name: str,
  created_at: datetime,
  updated_at: datetime
}
```

#### Order Model
```python
{
  _id: ObjectId,
  user_id: ObjectId,  # reference to User
  items: [
    {
      paper_size: str,
      color_class: str,
      print_type: str,
      pages: int,
      copies: int,
      service: str,
      price_per_copy: float,
      service_cost: float,
      total_price: float,
      notes: str,
      file_method: str,
      file_details: str
    }
  ],
  total_amount: float,
  status: str,  # pending, processing, completed, cancelled
  created_at: datetime,
  updated_at: datetime
}
```

#### Cart Model (or embedded in User)
```python
{
  _id: ObjectId,
  user_id: ObjectId,  # reference to User
  items: [
    {
      paper_size: str,
      color_class: str,
      print_type: str,
      pages: int,
      copies: int,
      service: str,
      price_per_copy: float,
      service_cost: float,
      total_price: float,
      notes: str,
      file_method: str,
      file_details: str
    }
  ],
  updated_at: datetime
}
```

#### Pricing Configuration (static/config)
Store pricing data in a configuration collection or file

### Backend Structure
```
backend/
├── models/
│   ├── user.py
│   ├── order.py
│   └── cart.py
├── routes/
│   ├── auth.py
│   ├── orders.py
│   ├── cart.py
│   ├── pricing.py
│   └── upload.py
├── utils/
│   ├── auth.py (JWT helpers)
│   ├── pricing.py (pricing calculation logic)
│   └── upload.py (file upload helpers)
└── server.py
```

## 4. Frontend-Backend Integration Steps

### Step 1: Setup Authentication
1. Create auth context in React
2. Add login/register pages
3. Store JWT token in localStorage
4. Add axios interceptors for auth headers

### Step 2: Replace Mock Pricing Data
1. Create API service file: `src/services/api.js`
2. Fetch pricing data on app load
3. Replace mockPricing imports with API calls

### Step 3: Integrate Cart System
1. Replace local cart state with API calls
2. Add loading states
3. Handle API errors with toasts
4. Sync cart on login

### Step 4: Add File Upload
1. Implement file upload form
2. Handle file preview
3. Upload files to server
4. Store file URLs with orders

### Step 5: Add Order History
1. Create orders page
2. Fetch user orders
3. Display order status
4. Add order tracking

## 5. Key Features to Implement

### Backend
- [x] JWT authentication
- [x] Password hashing with passlib
- [x] MongoDB models
- [x] CRUD operations for orders
- [x] Cart management
- [x] Price calculation API
- [x] File upload handling
- [x] Input validation

### Frontend
- [ ] Auth context and protected routes
- [ ] Login/Register pages
- [ ] API service layer
- [ ] Cart persistence with backend
- [ ] Order history page
- [ ] File upload with progress
- [ ] Error handling and loading states
- [ ] Toast notifications

## 6. Additional Enhancements
- Guest checkout (without registration)
- Order status tracking
- Admin panel for managing orders
- SMS notifications
- Payment gateway integration
- Invoice generation
- Order history and reordering

from fastapi import APIRouter, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorClient
import os
from models.user import UserCreate, UserLogin, UserResponse, AuthResponse
from utils.auth import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Get database
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"phone": user_data.phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="شماره تلفن قبلاً ثبت شده است")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    from models.user import User
    user = User(
        phone=user_data.phone,
        password=hashed_password,
        name=user_data.name
    )
    
    # Insert into database
    await db.users.insert_one(user.dict())
    
    # Create token
    token = create_access_token(data={"sub": user.id, "phone": user.phone})
    
    # Return response
    user_response = UserResponse(
        id=user.id,
        phone=user.phone,
        name=user.name,
        created_at=user.created_at
    )
    
    return AuthResponse(user=user_response, token=token)

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"phone": credentials.phone})
    if not user:
        raise HTTPException(status_code=401, detail="شماره تلفن یا رمز عبور اشتباه است")
    
    # Verify password
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="شماره تلفن یا رمز عبور اشتباه است")
    
    # Create token
    token = create_access_token(data={"sub": user['id'], "phone": user['phone']})
    
    # Return response
    user_response = UserResponse(
        id=user['id'],
        phone=user['phone'],
        name=user.get('name'),
        created_at=user['created_at']
    )
    
    return AuthResponse(user=user_response, token=token)

@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="احراز هویت لازم است")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="توکن نامعتبر است")
    
    user_id = payload.get("sub")
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد")
    
    return UserResponse(
        id=user['id'],
        phone=user['phone'],
        name=user.get('name'),
        created_at=user['created_at']
    )
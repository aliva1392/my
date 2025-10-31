from fastapi import APIRouter, HTTPException, Depends
from database import db
from routes.admin import verify_admin
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/admin/pricing", tags=["admin-pricing"])

class PriceTierUpdate(BaseModel):
    min: int
    max: int
    single: float
    double: float

class PricingUpdate(BaseModel):
    color_class_id: str
    tiers: List[PriceTierUpdate]

class ServiceUpdate(BaseModel):
    id: str
    label: str
    price: float
    min_pages: Optional[int] = None

@router.put("/tiers")
async def update_pricing_tiers(
    pricing_update: PricingUpdate,
    admin_id: str = Depends(verify_admin)
):
    # Save to database
    pricing_doc = {
        "color_class_id": pricing_update.color_class_id,
        "tiers": [tier.dict() for tier in pricing_update.tiers],
        "updated_at": datetime.utcnow(),
        "updated_by": admin_id
    }
    
    # Upsert pricing configuration
    await db.pricing_configs.update_one(
        {"color_class_id": pricing_update.color_class_id},
        {"$set": pricing_doc},
        upsert=True
    )
    
    # Log the change
    await db.pricing_logs.insert_one({
        "type": "pricing_update",
        "color_class_id": pricing_update.color_class_id,
        "admin_id": admin_id,
        "timestamp": datetime.utcnow(),
        "data": pricing_doc
    })
    
    return {"message": "نرخ‌ها با موفقیت به‌روز شد", "pricing": pricing_doc}

@router.put("/services")
async def update_service(
    service_update: ServiceUpdate,
    admin_id: str = Depends(verify_admin)
):
    service_doc = {
        "id": service_update.id,
        "label": service_update.label,
        "price": service_update.price,
        "min_pages": service_update.min_pages,
        "updated_at": datetime.utcnow(),
        "updated_by": admin_id
    }
    
    # Upsert service configuration
    await db.services_configs.update_one(
        {"id": service_update.id},
        {"$set": service_doc},
        upsert=True
    )
    
    # Log the change
    await db.pricing_logs.insert_one({
        "type": "service_update",
        "service_id": service_update.id,
        "admin_id": admin_id,
        "timestamp": datetime.utcnow(),
        "data": service_doc
    })
    
    return {"message": "خدمات با موفقیت به‌روز شد", "service": service_doc}

@router.get("/history")
async def get_pricing_history(
    limit: int = 50,
    admin_id: str = Depends(verify_admin)
):
    logs = await db.pricing_logs.find({}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for log in logs:
        log.pop('_id', None)
        # Get admin name
        admin = await db.users.find_one({"id": log.get('admin_id')})
        if admin:
            log['admin_name'] = admin.get('name', 'نامشخص')
    
    return {"logs": logs, "total": len(logs)}
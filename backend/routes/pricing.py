from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db

router = APIRouter(prefix="/pricing", tags=["pricing"])

async def get_pricing_from_db():
    """Get pricing configuration from database, fallback to hardcoded if not found"""
    pricing_doc = await db.pricing_config.find_one({"id": "pricing_config"})
    
    if not pricing_doc:
        # Initialize from hardcoded values
        from utils.pricing import paper_sizes, color_classes, print_types, services, pricing_tiers
        pricing_data = {
            "id": "pricing_config",
            "paper_sizes": paper_sizes,
            "color_classes": color_classes,
            "print_types": print_types,
            "services": services,
            "pricing_tiers": pricing_tiers
        }
        await db.pricing_config.insert_one(pricing_data)
        return pricing_data
    
    return pricing_doc

def calculate_price_from_config(pricing_tiers: dict, color_class_id: str, print_type: str, total_pages: int) -> float:
    tiers = pricing_tiers.get(color_class_id)
    if not tiers:
        return 0
    
    for tier in tiers:
        if tier['min'] <= total_pages <= tier['max']:
            return tier.get(print_type, 0)
    
    return 0

def get_service_cost_from_config(services: list, service_id: str, pages: int) -> float:
    service = next((s for s in services if s['id'] == service_id), None)
    if not service:
        return 0
    
    if 'min_pages' in service and pages < service['min_pages']:
        return 0
    
    return service['price']

class PriceCalculationRequest(BaseModel):
    color_class: str
    print_type: str
    pages: int
    copies: int
    service: str = 'none'

class PriceCalculationResponse(BaseModel):
    price_per_page: float
    total_pages: int
    price_per_copy: float
    service_cost: float
    total: float

@router.get("/")
async def get_pricing_data():
    return {
        "paper_sizes": paper_sizes,
        "color_classes": color_classes,
        "print_types": print_types,
        "services": services
    }

@router.post("/calculate", response_model=PriceCalculationResponse)
async def calculate_pricing(request: PriceCalculationRequest):
    total_pages = request.pages * request.copies
    price_per_page = calculate_price(request.color_class, request.print_type, total_pages)
    price_per_copy = price_per_page * request.pages
    service_cost = get_service_cost(request.service, request.pages)
    total = (price_per_copy * request.copies) + service_cost
    
    return PriceCalculationResponse(
        price_per_page=price_per_page,
        total_pages=total_pages,
        price_per_copy=price_per_copy,
        service_cost=service_cost,
        total=total
    )
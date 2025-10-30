from fastapi import APIRouter, HTTPException
from utils.pricing import (
    paper_sizes,
    color_classes,
    print_types,
    services,
    pricing_tiers,
    calculate_price,
    get_service_cost
)
from pydantic import BaseModel

router = APIRouter(prefix="/pricing", tags=["pricing"])

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
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
    price_per_sheet: float  # قیمت هر برگ
    sheets_per_copy: int    # تعداد برگ در هر نسخه
    total_sheets: int       # تعداد کل برگ
    price_per_copy: float   # قیمت هر نسخه
    service_cost: float     # هزینه خدمات
    total: float           # قیمت نهایی

@router.get("/")
async def get_pricing_data():
    pricing_config = await get_pricing_from_db()
    pricing_config.pop('_id', None)
    
    return {
        "paper_sizes": pricing_config.get('paper_sizes'),
        "color_classes": pricing_config.get('color_classes'),
        "print_types": pricing_config.get('print_types'),
        "services": pricing_config.get('services')
    }

@router.post("/calculate", response_model=PriceCalculationResponse)
async def calculate_pricing(request: PriceCalculationRequest):
    pricing_config = await get_pricing_from_db()
    
    # محاسبه تعداد برگ بر اساس نوع چاپ
    # تک‌رو: هر صفحه = یک برگ
    # دورو: هر دو صفحه = یک برگ
    if request.print_type == 'double':
        # چاپ دورو: تعداد صفحات تقسیم بر 2 (با رند به سمت بالا)
        import math
        sheets_per_copy = math.ceil(request.pages / 2)
    else:
        # چاپ تک‌رو: تعداد صفحات = تعداد برگ
        sheets_per_copy = request.pages
    
    # تعداد کل برگ برای همه نسخه‌ها
    total_sheets = sheets_per_copy * request.copies
    
    # قیمت هر برگ بر اساس تعداد کل برگ و تعرفه
    price_per_sheet = calculate_price_from_config(
        pricing_config.get('pricing_tiers', {}),
        request.color_class,
        request.print_type,
        total_sheets
    )
    
    # قیمت هر نسخه = تعداد برگ در هر نسخه × قیمت هر برگ
    price_per_copy = sheets_per_copy * price_per_sheet
    
    # هزینه خدمات (بر اساس تعداد صفحات)
    service_cost = get_service_cost_from_config(
        pricing_config.get('services', []),
        request.service,
        request.pages
    )
    
    # قیمت نهایی
    total = (price_per_copy * request.copies) + service_cost
    
    return PriceCalculationResponse(
        price_per_sheet=price_per_sheet,
        sheets_per_copy=sheets_per_copy,
        total_sheets=total_sheets,
        price_per_copy=price_per_copy,
        service_cost=service_cost,
        total=total
    )
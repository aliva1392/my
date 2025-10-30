# Pricing configuration

paper_sizes = [
    {'id': 'a3', 'label': 'کاغذ A3'},
    {'id': 'a4', 'label': 'کاغذ A4'},
    {'id': 'a5', 'label': 'کاغذ A5'}
]

color_classes = {
    'a3': [
        {'id': 'a3_bw_simple', 'label': 'سیاه سفید - معمولی', 'type': 'bw'},
        {'id': 'a3_bw_medium', 'label': 'سیاه سفید - کلاس یک', 'type': 'bw'},
        {'id': 'a3_color_80', 'label': 'رنگی - کاغذ تحریر 80 گرم', 'type': 'color'},
        {'id': 'a3_color_glossy_200', 'label': 'رنگی - کاغذ گلاسه تا 200 گرم', 'type': 'color'},
        {'id': 'a3_color_glossy_250', 'label': 'رنگی - کاغذ گلاسه 250 گرم', 'type': 'color'}
    ],
    'a4': [
        {'id': 'a4_bw_simple', 'label': 'سیاه سفید - معمولی', 'type': 'bw'},
        {'id': 'a4_bw_medium', 'label': 'سیاه سفید - کلاس یک', 'type': 'bw'},
        {'id': 'a4_color_80', 'label': 'رنگی - کاغذ تحریر 80 گرم', 'type': 'color'},
        {'id': 'a4_color_glossy_135', 'label': 'رنگی - کاغذ گلاسه 135 گرم', 'type': 'color'},
        {'id': 'a4_color_glossy_300', 'label': 'رنگی - کاغذ گلاسه 300 گرم', 'type': 'color'}
    ],
    'a5': [
        {'id': 'a5_bw_simple', 'label': 'سیاه سفید - معمولی', 'type': 'bw'},
        {'id': 'a5_bw_medium', 'label': 'سیاه سفید - کلاس یک', 'type': 'bw'},
        {'id': 'a5_color_80', 'label': 'رنگی - کاغذ تحریر 80 گرم', 'type': 'color'},
        {'id': 'a5_color_glossy', 'label': 'رنگی - کاغذ گلاسه', 'type': 'color'}
    ]
}

print_types = {
    'bw': [
        {'id': 'single', 'label': 'تک رو'},
        {'id': 'double', 'label': 'دو رو'}
    ],
    'color': [
        {'id': 'single', 'label': 'تک رو'},
        {'id': 'double', 'label': 'دو رو'}
    ]
}

services = [
    {'id': 'none', 'label': 'هیچکدام', 'price': 0},
    {'id': 'sticker', 'label': 'سرچسب (حداقل 500 برگ)', 'price': 500, 'min_pages': 500},
    {'id': 'hotglue', 'label': 'صحافی چسب گرم', 'price': 15000},
    {'id': 'hardcover', 'label': 'صحافی هارد کاور (جلدسخت،رنگی)', 'price': 45000},
    {'id': 'shiraze', 'label': 'طلق و شیرازه', 'price': 8000},
    {'id': 'spring_15', 'label': 'فنری با طلق 15 میکرون', 'price': 6000},
    {'id': 'spring_400', 'label': 'فنری با طلق 400 میکرون', 'price': 12000},
    {'id': 'galing', 'label': 'گالینگور (3 روز کاری)', 'price': 20000}
]

pricing_tiers = {
    'a3_bw_simple': [
        {'min': 1, 'max': 499, 'single': 2600, 'double': 2980},
        {'min': 500, 'max': 999, 'single': 1980, 'double': 2800},
        {'min': 1000, 'max': float('inf'), 'single': 1800, 'double': 2500}
    ],
    'a3_bw_medium': [
        {'min': 1, 'max': 499, 'single': 2800, 'double': 3200},
        {'min': 500, 'max': 999, 'single': 2200, 'double': 3000},
        {'min': 1000, 'max': float('inf'), 'single': 2000, 'double': 2700}
    ],
    'a3_color_80': [
        {'min': 1, 'max': 499, 'single': 18000, 'double': 35000},
        {'min': 500, 'max': 999, 'single': 16000, 'double': 31000},
        {'min': 1000, 'max': float('inf'), 'single': 15000, 'double': 29000}
    ],
    'a3_color_glossy_200': [
        {'min': 1, 'max': float('inf'), 'single': 30000, 'double': 58000}
    ],
    'a3_color_glossy_250': [
        {'min': 1, 'max': float('inf'), 'single': 35000, 'double': 68000}
    ],
    'a4_bw_simple': [
        {'min': 1, 'max': 499, 'single': 1190, 'double': 1490},
        {'min': 500, 'max': 999, 'single': 990, 'double': 1390},
        {'min': 1000, 'max': float('inf'), 'single': 890, 'double': 1190}
    ],
    'a4_bw_medium': [
        {'min': 1, 'max': 499, 'single': 1390, 'double': 1690},
        {'min': 500, 'max': 999, 'single': 1190, 'double': 1590},
        {'min': 1000, 'max': float('inf'), 'single': 1090, 'double': 1390}
    ],
    'a4_color_80': [
        {'min': 1, 'max': 99, 'single': 5500, 'double': 10500},
        {'min': 100, 'max': 499, 'single': 4500, 'double': 8500},
        {'min': 500, 'max': 999, 'single': 3500, 'double': 6500},
        {'min': 1000, 'max': float('inf'), 'single': 2500, 'double': 4500}
    ],
    'a4_color_glossy_135': [
        {'min': 1, 'max': 99, 'single': 8000, 'double': 15000},
        {'min': 100, 'max': float('inf'), 'single': 7000, 'double': 13000}
    ],
    'a4_color_glossy_300': [
        {'min': 1, 'max': float('inf'), 'single': 15000, 'double': 29000}
    ],
    'a5_bw_simple': [
        {'min': 1, 'max': 499, 'single': 790, 'double': 890},
        {'min': 500, 'max': 1000, 'single': 750, 'double': 850},
        {'min': 1001, 'max': float('inf'), 'single': 690, 'double': 790}
    ],
    'a5_bw_medium': [
        {'min': 1, 'max': 499, 'single': 990, 'double': 1090},
        {'min': 500, 'max': 1000, 'single': 950, 'double': 1050},
        {'min': 1001, 'max': float('inf'), 'single': 890, 'double': 990}
    ],
    'a5_color_80': [
        {'min': 1, 'max': 99, 'single': 3500, 'double': 6500},
        {'min': 100, 'max': 499, 'single': 2500, 'double': 4500},
        {'min': 500, 'max': float('inf'), 'single': 1500, 'double': 2500}
    ],
    'a5_color_glossy': [
        {'min': 1, 'max': float('inf'), 'single': 8000, 'double': 15000}
    ]
}

def calculate_price(color_class_id: str, print_type: str, total_pages: int) -> float:
    tiers = pricing_tiers.get(color_class_id)
    if not tiers:
        return 0
    
    for tier in tiers:
        if tier['min'] <= total_pages <= tier['max']:
            return tier.get(print_type, 0)
    
    return 0

def get_service_cost(service_id: str, pages: int) -> float:
    service = next((s for s in services if s['id'] == service_id), None)
    if not service:
        return 0
    
    if 'min_pages' in service and pages < service['min_pages']:
        return 0
    
    return service['price']
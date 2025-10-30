// Mock pricing data for printing services

export const paperSizes = [
  { id: 'a3', label: 'کاغذ A3' },
  { id: 'a4', label: 'کاغذ A4' },
  { id: 'a5', label: 'کاغذ A5' }
];

export const colorClasses = {
  a3: [
    { id: 'a3_bw_simple', label: 'سیاه سفید - معمولی', type: 'bw' },
    { id: 'a3_bw_medium', label: 'سیاه سفید - کلاس یک', type: 'bw' },
    { id: 'a3_color_80', label: 'رنگی - کاغذ تحریر 80 گرم', type: 'color' },
    { id: 'a3_color_glossy_200', label: 'رنگی - کاغذ گلاسه تا 200 گرم', type: 'color' },
    { id: 'a3_color_glossy_250', label: 'رنگی - کاغذ گلاسه 250 گرم', type: 'color' }
  ],
  a4: [
    { id: 'a4_bw_simple', label: 'سیاه سفید - معمولی', type: 'bw' },
    { id: 'a4_bw_medium', label: 'سیاه سفید - کلاس یک', type: 'bw' },
    { id: 'a4_color_80', label: 'رنگی - کاغذ تحریر 80 گرم', type: 'color' },
    { id: 'a4_color_glossy_135', label: 'رنگی - کاغذ گلاسه 135 گرم', type: 'color' },
    { id: 'a4_color_glossy_300', label: 'رنگی - کاغذ گلاسه 300 گرم', type: 'color' }
  ],
  a5: [
    { id: 'a5_bw_simple', label: 'سیاه سفید - معمولی', type: 'bw' },
    { id: 'a5_bw_medium', label: 'سیاه سفید - کلاس یک', type: 'bw' },
    { id: 'a5_color_80', label: 'رنگی - کاغذ تحریر 80 گرم', type: 'color' },
    { id: 'a5_color_glossy', label: 'رنگی - کاغذ گلاسه', type: 'color' }
  ]
};

export const printTypes = {
  bw: [
    { id: 'single', label: 'تک رو' },
    { id: 'double', label: 'دو رو' }
  ],
  color: [
    { id: 'single', label: 'تک رو' },
    { id: 'double', label: 'دو رو' }
  ]
};

export const services = [
  { id: 'none', label: 'هیچکدام', price: 0 },
  { id: 'sticker', label: 'سرچسب (حداقل 500 برگ)', price: 500, minPages: 500 },
  { id: 'hotglue', label: 'صحافی چسب گرم', price: 15000 },
  { id: 'hardcover', label: 'صحافی هارد کاور (جلدسخت،رنگی)', price: 45000 },
  { id: 'shiraze', label: 'طلق و شیرازه', price: 8000 },
  { id: 'spring_15', label: 'فنری با طلق 15 میکرون', price: 6000 },
  { id: 'spring_400', label: 'فنری با طلق 400 میکرون', price: 12000 },
  { id: 'galing', label: 'گالینگور (3 روز کاری)', price: 20000 }
];

// Pricing tiers based on total pages (pages * copies)
export const pricingTiers = {
  a3_bw_simple: [
    { min: 1, max: 499, single: 2600, double: 2980 },
    { min: 500, max: 999, single: 1980, double: 2800 },
    { min: 1000, max: Infinity, single: 1800, double: 2500 }
  ],
  a3_bw_medium: [
    { min: 1, max: 499, single: 2800, double: 3200 },
    { min: 500, max: 999, single: 2200, double: 3000 },
    { min: 1000, max: Infinity, single: 2000, double: 2700 }
  ],
  a3_color_80: [
    { min: 1, max: 499, single: 18000, double: 35000 },
    { min: 500, max: 999, single: 16000, double: 31000 },
    { min: 1000, max: Infinity, single: 15000, double: 29000 }
  ],
  a3_color_glossy_200: [
    { min: 1, max: Infinity, single: 30000, double: 58000 }
  ],
  a3_color_glossy_250: [
    { min: 1, max: Infinity, single: 35000, double: 68000 }
  ],
  a4_bw_simple: [
    { min: 1, max: 499, single: 1190, double: 1490 },
    { min: 500, max: 999, single: 990, double: 1390 },
    { min: 1000, max: Infinity, single: 890, double: 1190 }
  ],
  a4_bw_medium: [
    { min: 1, max: 499, single: 1390, double: 1690 },
    { min: 500, max: 999, single: 1190, double: 1590 },
    { min: 1000, max: Infinity, single: 1090, double: 1390 }
  ],
  a4_color_80: [
    { min: 1, max: 99, single: 5500, double: 10500 },
    { min: 100, max: 499, single: 4500, double: 8500 },
    { min: 500, max: 999, single: 3500, double: 6500 },
    { min: 1000, max: Infinity, single: 2500, double: 4500 }
  ],
  a4_color_glossy_135: [
    { min: 1, max: 99, single: 8000, double: 15000 },
    { min: 100, max: Infinity, single: 7000, double: 13000 }
  ],
  a4_color_glossy_300: [
    { min: 1, max: Infinity, single: 15000, double: 29000 }
  ],
  a5_bw_simple: [
    { min: 1, max: 499, single: 790, double: 890 },
    { min: 500, max: 1000, single: 750, double: 850 },
    { min: 1001, max: Infinity, single: 690, double: 790 }
  ],
  a5_bw_medium: [
    { min: 1, max: 499, single: 990, double: 1090 },
    { min: 500, max: 1000, single: 950, double: 1050 },
    { min: 1001, max: Infinity, single: 890, double: 990 }
  ],
  a5_color_80: [
    { min: 1, max: 99, single: 3500, double: 6500 },
    { min: 100, max: 499, single: 2500, double: 4500 },
    { min: 500, max: Infinity, single: 1500, double: 2500 }
  ],
  a5_color_glossy: [
    { min: 1, max: Infinity, single: 8000, double: 15000 }
  ]
};

export const calculatePrice = (colorClassId, printType, totalPages) => {
  const tiers = pricingTiers[colorClassId];
  if (!tiers) return 0;

  const tier = tiers.find(t => totalPages >= t.min && totalPages <= t.max);
  if (!tier) return 0;

  return printType === 'single' ? tier.single : tier.double;
};
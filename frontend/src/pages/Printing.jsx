import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Upload, MessageCircle, Send, Link as LinkIcon, Mail, Trash2, Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { pricingAPI, cartAPI, orderAPI } from '../services/api';

const Printing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [paperSizes, setPaperSizes] = useState([]);
  const [colorClasses, setColorClasses] = useState({});
  const [printTypes, setPrintTypes] = useState({});
  const [services, setServices] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  
  const [paperSize, setPaperSize] = useState('');
  const [colorClass, setColorClass] = useState('');
  const [printType, setPrintType] = useState('');
  const [pages, setPages] = useState('');
  const [copies, setCopies] = useState('');
  const [selectedService, setSelectedService] = useState('none');
  const [orderNotes, setOrderNotes] = useState('');
  const [fileMethod, setFileMethod] = useState('upload');
  const [fileDetails, setFileDetails] = useState('');
  
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  
  const [currentPrice, setCurrentPrice] = useState(0);
  const [serviceCost, setServiceCost] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [priceDetails, setPriceDetails] = useState(null); // ذخیره جزئیات قیمت از API

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await pricingAPI.getPricing();
        setPaperSizes(response.data.paper_sizes);
        setColorClasses(response.data.color_classes);
        setPrintTypes(response.data.print_types);
        setServices(response.data.services);
        setLoadingPricing(false);
      } catch (error) {
        console.error('Error loading pricing:', error);
        toast({ title: 'خطا', description: 'خطا در بارگذاری اطلاعات', variant: 'destructive' });
      }
    };
    loadPricing();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadCart();
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const availableColorClasses = paperSize ? colorClasses[paperSize] : [];
  const selectedColorClassObj = availableColorClasses.find(c => c.id === colorClass);
  const availablePrintTypes = selectedColorClassObj ? printTypes[selectedColorClassObj.type] : [];

  useEffect(() => {
    const calculateCurrentPrice = async () => {
      if (colorClass && printType && pages && copies) {
        setCalculating(true);
        try {
          const response = await pricingAPI.calculatePrice({
            color_class: colorClass,
            print_type: printType,
            pages: parseInt(pages),
            copies: parseInt(copies),
            service: selectedService
          });
          setPriceDetails(response.data); // ذخیره تمام جزئیات
          setCurrentPrice(response.data.price_per_copy);
          setServiceCost(response.data.service_cost);
        } catch (error) {
          console.error('Error calculating price:', error);
          setPriceDetails(null);
          setCurrentPrice(0);
          setServiceCost(0);
        }
        setCalculating(false);
      } else {
        setPriceDetails(null);
        setCurrentPrice(0);
        setServiceCost(0);
      }
    };
    calculateCurrentPrice();
  }, [colorClass, printType, pages, copies, selectedService]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({ title: 'نیاز به ورود', description: 'برای افزودن به سبد خرید باید وارد شوید', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (!paperSize || !colorClass || !printType || !pages || !copies) {
      toast({ title: 'خطا', description: 'لطفاً تمام فیلدهای الزامی را پر کنید', variant: 'destructive' });
      return;
    }
    setLoadingCart(true);
    try {
      await cartAPI.addToCart({
        paper_size: paperSize,
        color_class: colorClass,
        print_type: printType,
        pages: parseInt(pages),
        copies: parseInt(copies),
        service: selectedService,
        price_per_copy: currentPrice,
        service_cost: serviceCost,
        total_price: (currentPrice * parseInt(copies)) + serviceCost,
        notes: orderNotes,
        file_method: fileMethod,
        file_details: fileDetails
      });
      toast({ title: 'موفق', description: 'سفارش به سبد خرید اضافه شد' });
      await loadCart();
      setPaperSize('');
      setColorClass('');
      setPrintType('');
      setPages('');
      setCopies('');
      setSelectedService('none');
      setOrderNotes('');
      setFileDetails('');
    } catch (error) {
      toast({ title: 'خطا', description: error.response?.data?.detail || 'خطا در افزودن به سبد خرید', variant: 'destructive' });
    }
    setLoadingCart(false);
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      await cartAPI.removeFromCart(itemId);
      toast({ title: 'حذف شد', description: 'سفارش از سبد خرید حذف شد' });
      await loadCart();
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در حذف از سبد خرید', variant: 'destructive' });
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'خطا', description: 'سبد خرید خالی است', variant: 'destructive' });
      return;
    }
    try {
      await orderAPI.checkout();
      toast({ title: 'موفق', description: 'سفارش شما با موفقیت ثبت شد' });
      await loadCart();
    } catch (error) {
      toast({ title: 'خطا', description: error.response?.data?.detail || 'خطا در ثبت سفارش', variant: 'destructive' });
    }
  };

  const totalPages = pages && copies ? parseInt(pages) * parseInt(copies) : 0;
  const totalAmount = currentPrice * (copies ? parseInt(copies) : 0) + serviceCost;
  const cartTotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  if (loadingPricing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <img src="https://panel.topcopy.ir/dist/images/favicon.ico" alt="تاپکپی" className="w-8 h-8" />
                <span className="text-xl font-bold text-blue-600">تاپکپی</span>
              </div>
              <nav className="flex gap-6">
                <a href="#" className="text-gray-700 hover:text-blue-600 transition">اپلیکیشن</a>
                <a href="#" className="text-blue-600 font-semibold">سفارش پرینت</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2">
                    <img src="https://panel.topcopy.ir/dist/images/no-user.png" alt="کاربر" className="w-10 h-10 rounded-full" />
                    <div><p className="text-sm font-semibold">{user?.name || user?.phone}</p></div>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout}>خروج</Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/login')}>ورود</Button>
                  <Button size="sm" onClick={() => navigate('/register')}>ثبت نام</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">نکته:</span> لطفا برای ثبت آسانتر روی علامت آبی کلیک کنید
              </p>
              <p className="text-xs text-gray-600 mt-1">
                (تعرفه هر برگ بر اساس جمع کل ردیف های فاکتور شما محاسبه می شود و بر حسب تعداد متغیر است)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-gradient-to-l from-blue-600 to-blue-700 text-white">
                <CardTitle className="text-center">فرم سفارش پرینت</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="paperSize">سایز کاغذ <span className="text-red-500">*</span></Label>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>
                  <Select value={paperSize} onValueChange={setPaperSize}>
                    <SelectTrigger id="paperSize"><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>
                      {paperSizes.map(size => <SelectItem key={size.id} value={size.id}>{size.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="colorClass">رنگ و کلاس چاپ <span className="text-red-500">*</span></Label>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>
                  <Select value={colorClass} onValueChange={setColorClass} disabled={!paperSize}>
                    <SelectTrigger id="colorClass">
                      <SelectValue placeholder={paperSize ? "انتخاب کنید" : "سایز کاغذ را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColorClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="printType">نوع چاپ <span className="text-red-500">*</span></Label>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>
                  <Select value={printType} onValueChange={setPrintType} disabled={!colorClass}>
                    <SelectTrigger id="printType">
                      <SelectValue placeholder={colorClass ? "انتخاب کنید" : "رنگ و کلاس چاپ را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrintTypes.map(type => <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pages">تعداد صفحات <span className="text-red-500">*</span></Label>
                    <Input id="pages" type="number" min="1" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="1" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="copies">تعداد سری <span className="text-red-500">*</span></Label>
                    <Input id="copies" type="number" min="1" value={copies} onChange={(e) => setCopies(e.target.value)} placeholder="1" className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="service">خدمات</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service" className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {services.map(service => <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">توضیحات سفارش</Label>
                  <Textarea id="notes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="توضیحات خود را وارد کنید..." className="mt-2" rows={3} />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">انتخاب و ارسال فایل</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Button variant={fileMethod === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => setFileMethod('upload')}>
                      <Upload className="h-4 w-4 ml-2" />آپلود
                    </Button>
                    <Button variant={fileMethod === 'whatsapp' ? 'default' : 'outline'} size="sm" onClick={() => setFileMethod('whatsapp')}>
                      <MessageCircle className="h-4 w-4 ml-2" />واتساپ
                    </Button>
                    <Button variant={fileMethod === 'telegram' ? 'default' : 'outline'} size="sm" onClick={() => setFileMethod('telegram')}>
                      <Send className="h-4 w-4 ml-2" />تلگرام
                    </Button>
                    <Button variant={fileMethod === 'link' ? 'default' : 'outline'} size="sm" onClick={() => setFileMethod('link')}>
                      <LinkIcon className="h-4 w-4 ml-2" />لینک
                    </Button>
                    <Button variant={fileMethod === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setFileMethod('email')}>
                      <Mail className="h-4 w-4 ml-2" />ایمیل
                    </Button>
                  </div>
                  <Input type="text" value={fileDetails} onChange={(e) => setFileDetails(e.target.value)} placeholder="توضیحات فایل/شماره یا آی دی اکانت خود را وارد نمایید" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader className="bg-gradient-to-l from-green-600 to-green-700 text-white">
                <CardTitle className="text-center">خلاصه سفارش</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {calculating ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">تعداد برگه:</span>
                        <span className="font-semibold">{totalPages.toLocaleString('fa-IR')} برگه</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">هر برگه:</span>
                        <span className="font-semibold">{currentPrice.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t">
                        <span className="text-gray-600">مجموع:</span>
                        <span className="font-semibold text-lg">{(currentPrice * (copies ? parseInt(copies) : 0)).toLocaleString('fa-IR')} تومان</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">هزینه خدمات:</span>
                        <span className="font-semibold">{serviceCost.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t">
                        <span className="text-gray-700 font-bold">قابل پرداخت:</span>
                        <span className="font-bold text-xl text-green-600">{totalAmount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2 pt-4">
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAddToCart} disabled={loadingCart || calculating}>
                    {loadingCart ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />در حال افزودن...</> : 'ادامه سفارش'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleAddToCart} disabled={loadingCart || calculating}>
                    ثبت فایل بعدی
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader className="bg-gradient-to-l from-purple-600 to-purple-700 text-white">
            <CardTitle>سفارشات پرینت موجود در سبد خرید</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!isAuthenticated ? (
              <p className="text-center text-gray-500 py-8">برای مشاهده سبد خرید باید وارد شوید</p>
            ) : cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">در این نوع چاپ، سفارشی در سبد خرید موجود نیست.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">ردیف</th>
                      <th className="p-3 text-right">جزئیات</th>
                      <th className="p-3 text-right">هر سری</th>
                      <th className="p-3 text-right">تعداد سری</th>
                      <th className="p-3 text-right">مبلغ کل</th>
                      <th className="p-3 text-right">تنظیمات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p><strong>{item.paper_size}</strong> - {item.color_class}</p>
                            <p className="text-gray-600">{item.print_type} - {item.pages} صفحه</p>
                            <p className="text-gray-600">خدمات: {item.service}</p>
                          </div>
                        </td>
                        <td className="p-3">{item.price_per_copy.toLocaleString('fa-IR')} تومان</td>
                        <td className="p-3">{item.copies}</td>
                        <td className="p-3 font-semibold">{item.total_price.toLocaleString('fa-IR')} تومان</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveFromCart(item.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="4" className="p-3 text-left">جمع کل:</td>
                      <td className="p-3 text-lg text-green-600">{cartTotal.toLocaleString('fa-IR')} تومان</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {cart.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
                  تکمیل و پرداخت سفارش
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-lg font-semibold text-gray-700">
            تماس با ما: <a href="tel:02166270342" className="text-blue-600 hover:underline">۰۲۱-۶۶۲۷۰۳۴۲</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Printing;

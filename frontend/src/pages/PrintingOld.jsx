import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Upload, MessageCircle, Send, Link as LinkIcon, Mail, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import {
  paperSizes,
  colorClasses,
  printTypes,
  services,
  calculatePrice
} from '../data/mockPricing';

const Printing = () => {
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
  const [currentPrice, setCurrentPrice] = useState(0);
  const [serviceCost, setServiceCost] = useState(0);

  const availableColorClasses = paperSize ? colorClasses[paperSize] : [];
  const selectedColorClassObj = availableColorClasses.find(c => c.id === colorClass);
  const availablePrintTypes = selectedColorClassObj ? printTypes[selectedColorClassObj.type] : [];

  useEffect(() => {
    if (colorClass && printType && pages && copies) {
      const totalPages = parseInt(pages) * parseInt(copies);
      const pricePerPage = calculatePrice(colorClass, printType, totalPages);
      setCurrentPrice(pricePerPage * parseInt(pages));
    } else {
      setCurrentPrice(0);
    }
  }, [colorClass, printType, pages, copies]);

  useEffect(() => {
    const service = services.find(s => s.id === selectedService);
    if (service) {
      if (service.minPages && pages && parseInt(pages) < service.minPages) {
        setServiceCost(0);
      } else {
        setServiceCost(service.price);
      }
    }
  }, [selectedService, pages]);

  const handleAddToCart = () => {
    if (!paperSize || !colorClass || !printType || !pages || !copies) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای الزامی را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    const service = services.find(s => s.id === selectedService);
    const selectedPaperSize = paperSizes.find(p => p.id === paperSize);
    const selectedColorClass = availableColorClasses.find(c => c.id === colorClass);
    const selectedPrintType = availablePrintTypes.find(p => p.id === printType);

    const cartItem = {
      id: Date.now(),
      paperSize: selectedPaperSize.label,
      colorClass: selectedColorClass.label,
      printType: selectedPrintType.label,
      pages: parseInt(pages),
      copies: parseInt(copies),
      service: service.label,
      pricePerCopy: currentPrice,
      serviceCost: serviceCost,
      totalPrice: (currentPrice * parseInt(copies)) + serviceCost,
      notes: orderNotes,
      fileMethod,
      fileDetails
    };

    setCart([...cart, cartItem]);
    toast({
      title: 'موفق',
      description: 'سفارش به سبد خرید اضافه شد'
    });

    // Reset form
    setPaperSize('');
    setColorClass('');
    setPrintType('');
    setPages('');
    setCopies('');
    setSelectedService('none');
    setOrderNotes('');
    setFileDetails('');
  };

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast({
      title: 'حذف شد',
      description: 'سفارش از سبد خرید حذف شد'
    });
  };

  const totalPages = pages && copies ? parseInt(pages) * parseInt(copies) : 0;
  const totalAmount = currentPrice * (copies ? parseInt(copies) : 0) + serviceCost;
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
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
              <div className="flex items-center gap-2">
                <img src="https://panel.topcopy.ir/dist/images/no-user.png" alt="کاربر" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold">کاربر مهمان</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">ورود</Button>
                <Button size="sm">ثبت نام</Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Info Banner */}
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
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-gradient-to-l from-blue-600 to-blue-700 text-white">
                <CardTitle className="text-center">فرم سفارش پرینت</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Paper Size */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="paperSize">سایز کاغذ <span className="text-red-500">*</span></Label>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                    </Button>
                  </div>
                  <Select value={paperSize} onValueChange={setPaperSize}>
                    <SelectTrigger id="paperSize">
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {paperSizes.map(size => (
                        <SelectItem key={size.id} value={size.id}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Class */}
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
                      {availableColorClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Print Type */}
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
                      {availablePrintTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pages and Copies */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pages">تعداد صفحات <span className="text-red-500">*</span></Label>
                    <Input
                      id="pages"
                      type="number"
                      min="1"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      placeholder="1"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="copies">تعداد سری <span className="text-red-500">*</span></Label>
                    <Input
                      id="copies"
                      type="number"
                      min="1"
                      value={copies}
                      onChange={(e) => setCopies(e.target.value)}
                      placeholder="1"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Services */}
                <div>
                  <Label htmlFor="service">خدمات</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Notes */}
                <div>
                  <Label htmlFor="notes">توضیحات سفارش</Label>
                  <Textarea
                    id="notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="توضیحات خود را وارد کنید..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* File Upload Section */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">انتخاب و ارسال فایل</h3>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={fileMethod === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileMethod('upload')}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      آپلود
                    </Button>
                    <Button
                      variant={fileMethod === 'whatsapp' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileMethod('whatsapp')}
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      واتساپ
                    </Button>
                    <Button
                      variant={fileMethod === 'telegram' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileMethod('telegram')}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      تلگرام
                    </Button>
                    <Button
                      variant={fileMethod === 'link' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileMethod('link')}
                    >
                      <LinkIcon className="h-4 w-4 ml-2" />
                      لینک
                    </Button>
                    <Button
                      variant={fileMethod === 'email' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileMethod('email')}
                    >
                      <Mail className="h-4 w-4 ml-2" />
                      ایمیل
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={fileDetails}
                    onChange={(e) => setFileDetails(e.target.value)}
                    placeholder="توضیحات فایل/شماره یا آی دی اکانت خود را وارد نمایید"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="bg-gradient-to-l from-green-600 to-green-700 text-white">
                <CardTitle className="text-center">خلاصه سفارش</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
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
                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleAddToCart}
                  >
                    ادامه سفارش
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    ثبت فایل بعدی
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Shopping Cart */}
        <Card className="mt-8">
          <CardHeader className="bg-gradient-to-l from-purple-600 to-purple-700 text-white">
            <CardTitle>سفارشات پرینت موجود در سبد خرید</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {cart.length === 0 ? (
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
                            <p><strong>{item.paperSize}</strong> - {item.colorClass}</p>
                            <p className="text-gray-600">{item.printType} - {item.pages} صفحه</p>
                            <p className="text-gray-600">خدمات: {item.service}</p>
                          </div>
                        </td>
                        <td className="p-3">{item.pricePerCopy.toLocaleString('fa-IR')} تومان</td>
                        <td className="p-3">{item.copies}</td>
                        <td className="p-3 font-semibold">{item.totalPrice.toLocaleString('fa-IR')} تومان</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveFromCart(item.id)}
                            >
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
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  تکمیل و پرداخت سفارش
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
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
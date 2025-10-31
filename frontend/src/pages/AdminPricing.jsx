import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, DollarSign } from 'lucide-react';

const AdminPricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadPricing();
  }, [isAuthenticated]);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPricing();
      setPricing(response.data);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری نرخ‌ها',
        variant: 'destructive'
      });
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  if (loading) {
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">مدیریت نرخ‌ها و تعرفه‌ها</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Paper Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>سایزهای کاغذ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricing?.paper_sizes?.map((size) => (
                  <div key={size.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{size.label}</h3>
                    <p className="text-sm text-gray-600">شناسه: {size.id}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>خدمات اضافی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">خدمت</th>
                      <th className="p-3 text-right">قیمت</th>
                      <th className="p-3 text-right">حداقل صفحات</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing?.services?.map((service) => (
                      <tr key={service.id} className="border-b">
                        <td className="p-3">{service.label}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {service.price.toLocaleString('fa-IR')} تومان
                          </div>
                        </td>
                        <td className="p-3">
                          {service.min_pages ? `${service.min_pages} برگ` : '-'}
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/pricing/edit/service/${service.id}`)}
                          >
                            ویرایش
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Tiers for A4 */}
          <Card>
            <CardHeader>
              <CardTitle>تعرفه چاپ A4 (سیاه سفید - معمولی)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">از تعداد</th>
                      <th className="p-3 text-right">تا تعداد</th>
                      <th className="p-3 text-right">تک رو</th>
                      <th className="p-3 text-right">دو رو</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing?.pricing_tiers?.a4_bw_simple?.map((tier, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">{tier.min.toLocaleString('fa-IR')}</td>
                        <td className="p-3">
                          {tier.max === Infinity ? 'نامحدود' : tier.max.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 font-semibold text-green-600">
                          {tier.single.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3 font-semibold text-blue-600">
                          {tier.double.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/pricing/edit/a4-bw/${index}`)}
                          >
                            ویرایش
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Tiers for A4 Color */}
          <Card>
            <CardHeader>
              <CardTitle>تعرفه چاپ A4 (رنگی - کاغذ تحریر 80 گرم)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">از تعداد</th>
                      <th className="p-3 text-right">تا تعداد</th>
                      <th className="p-3 text-right">تک رو</th>
                      <th className="p-3 text-right">دو رو</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing?.pricing_tiers?.a4_color_80?.map((tier, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">{tier.min.toLocaleString('fa-IR')}</td>
                        <td className="p-3">
                          {tier.max === Infinity ? 'نامحدود' : tier.max.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 font-semibold text-green-600">
                          {tier.single.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3 font-semibold text-blue-600">
                          {tier.double.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" disabled>
                            ویرایش
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>نکته:</strong> برای ویرایش نرخ‌ها، لطفاً فایل <code className="bg-blue-100 px-2 py-1 rounded">backend/utils/pricing.py</code> را ویرایش کنید.
                در آینده این بخش به پنل اضافه خواهد شد.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPricing;

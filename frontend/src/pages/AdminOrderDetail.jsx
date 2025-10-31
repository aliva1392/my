import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, User, Phone, Calendar, Package } from 'lucide-react';

const AdminOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadOrderDetail();
  }, [isAuthenticated, orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getOrderDetail(orderId);
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری جزئیات سفارش',
        variant: 'destructive'
      });
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'در انتظار', class: 'bg-orange-100 text-orange-800' },
      processing: { label: 'در حال انجام', class: 'bg-blue-100 text-blue-800' },
      completed: { label: 'تکمیل شده', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'لغو شده', class: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>سفارش یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/orders')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">جزئیات سفارش</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات مشتری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">نام</p>
                  <p className="font-semibold">{order.user_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">شماره تلفن</p>
                  <p className="font-semibold" dir="ltr">{order.user_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">تاریخ ثبت</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">شناسه سفارش</p>
                <p className="font-mono text-xs">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">وضعیت</p>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600">تعداد آیتم</p>
                <p className="font-semibold">{order.items?.length || 0} آیتم</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">مبلغ کل</p>
                <p className="font-bold text-xl text-green-600">
                  {order.total_amount.toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>عملیات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                چاپ فاکتور
              </Button>
              <Button className="w-full" variant="outline">
                ارسال پیامک به مشتری
              </Button>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                لغو سفارش
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>آیتم‌های سفارش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        <Package className="inline h-5 w-5 ml-2" />
                        آیتم {index + 1}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-600">سایز کاغذ:</span> <strong>{item.paper_size}</strong></p>
                        <p><span className="text-gray-600">رنگ و کلاس:</span> {item.color_class}</p>
                        <p><span className="text-gray-600">نوع چاپ:</span> {item.print_type}</p>
                        <p><span className="text-gray-600">تعداد صفحات:</span> {item.pages} صفحه</p>
                        <p><span className="text-gray-600">تعداد سری:</span> {item.copies} سری</p>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-600">خدمات:</span> {item.service}</p>
                        <p><span className="text-gray-600">قیمت هر سری:</span> {item.price_per_copy.toLocaleString('fa-IR')} تومان</p>
                        <p><span className="text-gray-600">هزینه خدمات:</span> {item.service_cost.toLocaleString('fa-IR')} تومان</p>
                        <p className="font-bold text-lg mt-2">
                          <span className="text-gray-600">جمع:</span> 
                          <span className="text-green-600 mr-2">{item.total_price.toLocaleString('fa-IR')} تومان</span>
                        </p>
                      </div>
                      {item.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded">
                          <p className="text-xs text-gray-600">توضیحات:</p>
                          <p className="text-sm">{item.notes}</p>
                        </div>
                      )}
                      {item.file_details && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-xs text-gray-600">اطلاعات فایل ({item.file_method}):</p>
                          <p className="text-sm">{item.file_details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrderDetail;

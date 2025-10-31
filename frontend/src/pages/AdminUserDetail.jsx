import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, User, Phone, Calendar, ShoppingCart, DollarSign } from 'lucide-react';

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadUserDetail();
  }, [isAuthenticated, userId]);

  const loadUserDetail = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUserOrders(userId);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات کاربر',
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

  if (!data || !data.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>کاربر یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/users')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">جزئیات کاربر</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات کاربر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">نام</p>
                  <p className="font-semibold">{data.user.name || 'نامشخص'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">شماره تلفن</p>
                  <p className="font-semibold" dir="ltr">{data.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">تاریخ عضویت</p>
                  <p className="font-semibold">
                    {new Date(data.user.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">نقش</p>
                <div className="mt-1">
                  {data.user.is_admin ? (
                    <Badge className="bg-purple-100 text-purple-800">مدیر</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">کاربر</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>آمار خرید</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">تعداد سفارشات</p>
                  <p className="font-bold text-2xl text-blue-600">{data.total_orders}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">مجموع خرید</p>
                  <p className="font-bold text-2xl text-green-600">
                    {data.total_spent.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
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
                ارسال پیامک
              </Button>
              <Button className="w-full" variant="outline">
                ارسال ایمیل
              </Button>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                مسدود کردن کاربر
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>سفارشات کاربر ({data.orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">این کاربر هیچ سفارشی ندارد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">شناسه</th>
                      <th className="p-3 text-right">تعداد آیتم</th>
                      <th className="p-3 text-right">مبلغ</th>
                      <th className="p-3 text-right">وضعیت</th>
                      <th className="p-3 text-right">تاریخ</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className="text-xs text-gray-500">{order.id.substring(0, 8)}...</span>
                        </td>
                        <td className="p-3">{order.items?.length || 0} آیتم</td>
                        <td className="p-3 font-semibold">
                          {order.total_amount.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3">{getStatusBadge(order.status)}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                          >
                            مشاهده
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserDetail;

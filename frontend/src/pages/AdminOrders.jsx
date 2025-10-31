import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, Eye } from 'lucide-react';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated, filterStatus, page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 20,
        skip: (page - 1) * 20
      };
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await adminAPI.getOrders(params);
      setOrders(response.data.orders);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری سفارشات',
        variant: 'destructive'
      });
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      toast({
        title: 'موفق',
        description: 'وضعیت سفارش به‌روز شد'
      });
      loadOrders();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت',
        variant: 'destructive'
      });
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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">مدیریت سفارشات</h1>
            </div>
            <div className="flex items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سفارشات</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="processing">در حال انجام</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="cancelled">لغو شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>لیست سفارشات ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">سفارشی یافت نشد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">شناسه</th>
                      <th className="p-3 text-right">مشتری</th>
                      <th className="p-3 text-right">تعداد آیتم</th>
                      <th className="p-3 text-right">مبلغ</th>
                      <th className="p-3 text-right">وضعیت</th>
                      <th className="p-3 text-right">تاریخ</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className="text-xs text-gray-500">{order.id.substring(0, 8)}...</span>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-semibold">{order.user_name}</p>
                            <p className="text-sm text-gray-600">{order.user_phone}</p>
                          </div>
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
                          <div className="flex gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">در انتظار</SelectItem>
                                <SelectItem value="processing">در حال انجام</SelectItem>
                                <SelectItem value="completed">تکمیل شده</SelectItem>
                                <SelectItem value="cancelled">لغو شده</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  قبلی
                </Button>
                <span className="flex items-center px-4">
                  صفحه {page} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  بعدی
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrders;

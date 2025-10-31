import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  LogOut
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadDashboard();
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: error.response?.data?.detail || 'خطا در بارگذاری داشبورد',
        variant: 'destructive'
      });
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
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
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold">پنل مدیریت تاپکپی</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">مدیر: {user?.name || user?.phone}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <Button variant="default" onClick={() => navigate('/admin/dashboard')}>
            داشبورد
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/orders')}>
            مدیریت سفارشات
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            مدیریت کاربران
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/pricing')}>
            مدیریت نرخ‌ها
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">کل سفارشات</CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_orders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">در انتظار</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats?.pending_orders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">تکمیل شده</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.completed_orders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">کل درآمد</CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(stats?.total_revenue || 0).toLocaleString('fa-IR')} تومان
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سفارشات امروز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{stats?.today_orders || 0}</div>
              <p className="text-sm text-gray-600 mt-2">سفارش جدید</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سفارشات این ماه</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-indigo-600">{stats?.month_orders || 0}</div>
              <p className="text-sm text-gray-600 mt-2">سفارش در ماه جاری</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">کل کاربران</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{stats?.total_users || 0}</div>
              <p className="text-sm text-gray-600 mt-2">کاربر ثبت‌نام شده</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>دسترسی سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-20 text-lg" 
                onClick={() => navigate('/admin/orders?status=pending')}
              >
                <Clock className="h-6 w-6 ml-2" />
                سفارشات در انتظار
              </Button>
              <Button 
                className="h-20 text-lg" 
                variant="outline"
                onClick={() => navigate('/admin/orders')}
              >
                <ShoppingCart className="h-6 w-6 ml-2" />
                همه سفارشات
              </Button>
              <Button 
                className="h-20 text-lg" 
                variant="outline"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="h-6 w-6 ml-2" />
                لیست کاربران
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

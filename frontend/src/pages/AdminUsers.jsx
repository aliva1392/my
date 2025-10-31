import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, User, ShoppingCart } from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadUsers();
  }, [isAuthenticated, page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 20,
        skip: (page - 1) * 20
      };
      
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری کاربران',
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
              <h1 className="text-xl font-bold">مدیریت کاربران</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>لیست کاربران ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">کاربری یافت نشد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">نام</th>
                      <th className="p-3 text-right">شماره تلفن</th>
                      <th className="p-3 text-right">تعداد سفارش</th>
                      <th className="p-3 text-right">نقش</th>
                      <th className="p-3 text-right">تاریخ عضویت</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">{user.name || 'نامشخص'}</span>
                          </div>
                        </td>
                        <td className="p-3" dir="ltr">{user.phone}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                            <span>{user.order_count} سفارش</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {user.is_admin ? (
                            <Badge className="bg-purple-100 text-purple-800">مدیر</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">کاربر</Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            مشاهده سفارشات
                          </Button>
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

export default AdminUsers;

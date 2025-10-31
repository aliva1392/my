import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { adminAPI } from '../services/adminApi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const AdminServiceEdit = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { isAuthenticated } = useAuth();
  const [service, setService] = useState({
    id: '',
    label: '',
    price: 0,
    min_pages: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadService();
  }, [isAuthenticated, serviceId]);

  const loadService = async () => {
    try {
      const response = await adminAPI.getPricing();
      const found = response.data.services.find(s => s.id === serviceId);
      if (found) {
        setService({
          id: found.id,
          label: found.label,
          price: found.price,
          min_pages: found.min_pages || null
        });
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در بارگذاری خدمات', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/admin/pricing/services', {
        id: service.id,
        label: service.label,
        price: parseFloat(service.price),
        min_pages: service.min_pages ? parseInt(service.min_pages) : null
      });
      toast({ title: 'موفق', description: 'خدمات با موفقیت ذخیره شد' });
      navigate('/admin/pricing');
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در ذخیره خدمات', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin/pricing')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">ویرایش خدمات</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات خدمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-xl">
              <div>
                <Label>شناسه خدمت</Label>
                <Input value={service.id} disabled className="mt-2 bg-gray-100" />
              </div>
              
              <div>
                <Label>نام خدمت</Label>
                <Input
                  value={service.label}
                  onChange={(e) => setService({...service, label: e.target.value})}
                  className="mt-2"
                  placeholder="نام خدمت را وارد کنید"
                />
              </div>

              <div>
                <Label>قیمت (تومان)</Label>
                <Input
                  type="number"
                  value={service.price}
                  onChange={(e) => setService({...service, price: e.target.value})}
                  className="mt-2"
                  placeholder="0"
                />
              </div>

              <div>
                <Label>حداقل صفحات (اختیاری)</Label>
                <Input
                  type="number"
                  value={service.min_pages || ''}
                  onChange={(e) => setService({...service, min_pages: e.target.value || null})}
                  className="mt-2"
                  placeholder="مثلاً 500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  اگر این خدمت نیاز به حداقل تعداد صفحات دارد، وارد کنید
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 ml-2 animate-spin" />در حال ذخیره...</>
                  ) : (
                    <><Save className="h-4 w-4 ml-2" />ذخیره تغییرات</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/pricing')}>
                  انصراف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminServiceEdit;

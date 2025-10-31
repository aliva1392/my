import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { adminAPI } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const AdminEditService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState(null);
  const [formData, setFormData] = useState({
    price: 0,
    min_pages: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadService();
  }, [isAuthenticated, serviceId]);

  const loadService = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPricing();
      const services = response.data.services || [];
      const foundService = services.find(s => s.id === serviceId);
      
      if (!foundService) {
        toast({
          title: 'خطا',
          description: 'خدمت پیدا نشد',
          variant: 'destructive'
        });
        navigate('/admin/pricing');
        return;
      }
      
      setService(foundService);
      setFormData({
        price: foundService.price,
        min_pages: foundService.min_pages || ''
      });
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات خدمت',
        variant: 'destructive'
      });
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        price: parseFloat(formData.price),
        min_pages: formData.min_pages ? parseInt(formData.min_pages) : null
      };

      await adminAPI.updateServicePrice(serviceId, updateData);
      
      toast({
        title: 'موفق',
        description: 'قیمت خدمت با موفقیت به‌روز شد',
      });
      
      navigate('/admin/pricing');
    } catch (error) {
      toast({
        title: 'خطا',
        description: error.response?.data?.detail || 'خطا در به‌روزرسانی قیمت',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
              <Button variant="ghost" onClick={() => navigate('/admin/pricing')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">ویرایش خدمت</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{service?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">قیمت (تومان)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="100"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_pages">حداقل تعداد برگ (اختیاری)</Label>
                <Input
                  id="min_pages"
                  type="number"
                  value={formData.min_pages}
                  onChange={(e) => setFormData({ ...formData, min_pages: e.target.value })}
                  min="0"
                  className="text-right"
                  placeholder="اگر محدودیت ندارد خالی بگذارید"
                />
                <p className="text-sm text-gray-500">
                  اگر این خدمت نیاز به حداقل تعداد برگ دارد، اینجا وارد کنید
                </p>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/pricing')}
                  disabled={saving}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEditService;

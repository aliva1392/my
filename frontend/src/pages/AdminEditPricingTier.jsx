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

const AdminEditPricingTier = () => {
  const navigate = useNavigate();
  const { colorClassId, tierIndex } = useParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tierInfo, setTierInfo] = useState(null);
  const [formData, setFormData] = useState({
    min: 0,
    max: 0,
    single: 0,
    double: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadTier();
  }, [isAuthenticated, colorClassId, tierIndex]);

  const getColorClassName = (colorClassId) => {
    const names = {
      'a4_bw_simple': 'A4 - سیاه سفید - معمولی',
      'a4_bw_medium': 'A4 - سیاه سفید - کلاس یک',
      'a4_color_80': 'A4 - رنگی - کاغذ تحریر 80 گرم',
      'a4_color_glossy_135': 'A4 - رنگی - کاغذ گلاسه 135 گرم',
      'a4_color_glossy_300': 'A4 - رنگی - کاغذ گلاسه 300 گرم',
      'a3_bw_simple': 'A3 - سیاه سفید - معمولی',
      'a3_bw_medium': 'A3 - سیاه سفید - کلاس یک',
      'a3_color_80': 'A3 - رنگی - کاغذ تحریر 80 گرم',
      'a3_color_glossy_200': 'A3 - رنگی - کاغذ گلاسه تا 200 گرم',
      'a3_color_glossy_250': 'A3 - رنگی - کاغذ گلاسه 250 گرم',
      'a5_bw_simple': 'A5 - سیاه سفید - معمولی',
      'a5_bw_medium': 'A5 - سیاه سفید - کلاس یک',
      'a5_color_80': 'A5 - رنگی - کاغذ تحریر 80 گرم',
      'a5_color_glossy': 'A5 - رنگی - کاغذ گلاسه'
    };
    return names[colorClassId] || colorClassId;
  };

  const loadTier = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPricing();
      const pricingTiers = response.data.pricing_tiers || {};
      const tiers = pricingTiers[colorClassId];
      
      if (!tiers || !tiers[tierIndex]) {
        toast({
          title: 'خطا',
          description: 'تعرفه پیدا نشد',
          variant: 'destructive'
        });
        navigate('/admin/pricing');
        return;
      }
      
      const tier = tiers[tierIndex];
      setTierInfo({
        colorClassName: getColorClassName(colorClassId),
        tierNumber: parseInt(tierIndex) + 1
      });
      
      setFormData({
        min: tier.min,
        max: tier.max === 999999 ? '' : tier.max, // Empty for infinity
        single: tier.single,
        double: tier.double
      });
      setLoading(false);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات تعرفه',
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
        min: parseInt(formData.min),
        max: formData.max === '' ? 999999 : parseFloat(formData.max),
        single: parseFloat(formData.single),
        double: parseFloat(formData.double)
      };

      // Validation
      if (updateData.min < 0) {
        toast({
          title: 'خطا',
          description: 'حداقل نمی‌تواند منفی باشد',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      if (updateData.max !== 999999 && updateData.max <= updateData.min) {
        toast({
          title: 'خطا',
          description: 'حداکثر باید بیشتر از حداقل باشد',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      await adminAPI.updatePricingTier(colorClassId, tierIndex, updateData);
      
      toast({
        title: 'موفق',
        description: 'تعرفه با موفقیت به‌روز شد',
      });
      
      navigate('/admin/pricing');
    } catch (error) {
      toast({
        title: 'خطا',
        description: error.response?.data?.detail || 'خطا در به‌روزرسانی تعرفه',
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
              <h1 className="text-xl font-bold">ویرایش تعرفه</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {tierInfo?.colorClassName} - رده {tierInfo?.tierNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">از تعداد (حداقل)</Label>
                  <Input
                    id="min"
                    type="number"
                    value={formData.min}
                    onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                    required
                    min="0"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max">تا تعداد (حداکثر)</Label>
                  <Input
                    id="max"
                    type="number"
                    value={formData.max}
                    onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                    min="0"
                    className="text-right"
                    placeholder="خالی = نامحدود"
                  />
                  <p className="text-sm text-gray-500">
                    برای نامحدود خالی بگذارید
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="single">قیمت تک رو (تومان)</Label>
                  <Input
                    id="single"
                    type="number"
                    value={formData.single}
                    onChange={(e) => setFormData({ ...formData, single: e.target.value })}
                    required
                    min="0"
                    step="10"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="double">قیمت دو رو (تومان)</Label>
                  <Input
                    id="double"
                    type="number"
                    value={formData.double}
                    onChange={(e) => setFormData({ ...formData, double: e.target.value })}
                    required
                    min="0"
                    step="10"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>نکته:</strong> قیمت‌ها به ازای هر برگ محاسبه می‌شوند. 
                  تعرفه بر اساس تعداد کل برگ‌های چاپی تعیین می‌گردد.
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

export default AdminEditPricingTier;

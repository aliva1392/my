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
import { ArrowLeft, Loader2, Plus, Trash2, Save } from 'lucide-react';

const AdminPricingEdit = () => {
  const navigate = useNavigate();
  const { colorClassId } = useParams();
  const { isAuthenticated } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [colorClassName, setColorClassName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadPricing();
  }, [isAuthenticated, colorClassId]);

  const loadPricing = async () => {
    try {
      const response = await adminAPI.getPricing();
      const allTiers = response.data.pricing_tiers[colorClassId];
      
      if (allTiers) {
        setTiers(allTiers);
        // Find color class name
        const allClasses = Object.values(response.data.color_classes).flat();
        const found = allClasses.find(c => c.id === colorClassId);
        if (found) setColorClassName(found.label);
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در بارگذاری نرخ‌ها', variant: 'destructive' });
    }
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: parseFloat(value) || 0 };
    setTiers(newTiers);
  };

  const addTier = () => {
    setTiers([...tiers, { min: 1, max: 100, single: 0, double: 0 }]);
  };

  const removeTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/admin/pricing/tiers', {
        color_class_id: colorClassId,
        tiers: tiers
      });
      toast({ title: 'موفق', description: 'نرخ‌ها با موفقیت ذخیره شد' });
      navigate('/admin/pricing');
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در ذخیره نرخ‌ها', variant: 'destructive' });
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
              <h1 className="text-xl font-bold">ویرایش نرخ {colorClassName}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>تعرفه‌های پلکانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiers.map((tier, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <Label>از تعداد</Label>
                      <Input
                        type="number"
                        value={tier.min}
                        onChange={(e) => handleTierChange(index, 'min', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>تا تعداد</Label>
                      <Input
                        type="number"
                        value={tier.max}
                        onChange={(e) => handleTierChange(index, 'max', e.target.value)}
                        className="mt-2"
                        placeholder="999999 برای نامحدود"
                      />
                    </div>
                    <div>
                      <Label>تک رو (تومان)</Label>
                      <Input
                        type="number"
                        value={tier.single}
                        onChange={(e) => handleTierChange(index, 'single', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>دو رو (تومان)</Label>
                      <Input
                        type="number"
                        value={tier.double}
                        onChange={(e) => handleTierChange(index, 'double', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeTier(index)}
                        disabled={tiers.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={addTier} className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                افزودن پله جدید
              </Button>

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

export default AdminPricingEdit;
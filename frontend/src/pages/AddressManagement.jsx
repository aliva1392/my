import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { addressAPI } from '../services/addressApi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { MapPin, Plus, Edit, Trash2, Check, Loader2, Home } from 'lucide-react';

const AddressManagement = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    province: '',
    city: '',
    full_address: '',
    postal_code: '',
    phone: '',
    latitude: '',
    longitude: '',
    is_default: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAddresses();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await addressAPI.getAddresses();
      setAddresses(response.data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری آدرس‌ها',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      province: '',
      city: '',
      full_address: '',
      postal_code: '',
      phone: '',
      latitude: '',
      longitude: '',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        title: address.title,
        province: address.province,
        city: address.city,
        full_address: address.full_address,
        postal_code: address.postal_code,
        phone: address.phone,
        latitude: address.latitude || '',
        longitude: address.longitude || '',
        is_default: address.is_default
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      if (editingAddress) {
        await addressAPI.updateAddress(editingAddress.id, submitData);
        toast({
          title: 'موفق',
          description: 'آدرس با موفقیت به‌روز شد'
        });
      } else {
        await addressAPI.createAddress(submitData);
        toast({
          title: 'موفق',
          description: 'آدرس جدید با موفقیت اضافه شد'
        });
      }

      await loadAddresses();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: 'خطا',
        description: error.response?.data?.detail || 'خطا در ذخیره آدرس',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!confirm('آیا از حذف این آدرس اطمینان دارید؟')) {
      return;
    }

    try {
      await addressAPI.deleteAddress(addressId);
      toast({
        title: 'موفق',
        description: 'آدرس با موفقیت حذف شد'
      });
      await loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف آدرس',
        variant: 'destructive'
      });
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await addressAPI.setDefaultAddress(addressId);
      toast({
        title: 'موفق',
        description: 'آدرس پیش‌فرض تغییر کرد'
      });
      await loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تعیین آدرس پیش‌فرض',
        variant: 'destructive'
      });
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
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">مدیریت آدرس‌ها</h1>
            </div>
            <Button onClick={() => navigate('/printing')}>
              <Home className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Add Button */}
        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                افزودن آدرس جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="خانه، محل کار، ..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره تماس *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="09123456789"
                      pattern="09\d{9}"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">استان *</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="تهران"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">شهر *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="تهران"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_address">آدرس کامل *</Label>
                  <Input
                    id="full_address"
                    value={formData.full_address}
                    onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                    placeholder="خیابان، کوچه، پلاک، واحد"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">کد پستی *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="1234567890"
                    pattern="\d{10}"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-gray-500">کد پستی 10 رقمی بدون خط تیره</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">عرض جغرافیایی (اختیاری)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="35.6892"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">طول جغرافیایی (اختیاری)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="51.3890"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_default" className="cursor-pointer">
                    تعیین به عنوان آدرس پیش‌فرض
                  </Label>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
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
                      editingAddress ? 'به‌روزرسانی' : 'افزودن'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">هیچ آدرسی ثبت نشده</h3>
              <p className="text-gray-600 mb-4">برای شروع، آدرس اول خود را اضافه کنید</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className={address.is_default ? 'border-blue-500 border-2' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{address.title}</CardTitle>
                    </div>
                    {address.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        پیش‌فرض
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">
                      <span className="font-medium">استان:</span> {address.province}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">شهر:</span> {address.city}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">آدرس:</span> {address.full_address}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">کد پستی:</span> {address.postal_code}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">تلفن:</span> {address.phone}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 ml-1" />
                        پیش‌فرض
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(address)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressManagement;

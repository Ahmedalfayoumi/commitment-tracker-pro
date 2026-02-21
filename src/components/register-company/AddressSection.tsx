import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterCompanyFormData } from "@/components/register-company/types";

interface AddressSectionProps {
  formData: RegisterCompanyFormData;
  setFormData: (data: RegisterCompanyFormData) => void;
}

export function AddressSection({ formData, setFormData }: AddressSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تفاصيل العنوان</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">الدولة *</Label>
            <Input
              id="country"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="مثال: الأردن"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="مثال: عمان"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">الشارع *</Label>
          <Input
            id="street"
            required
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            placeholder="أدخل اسم الشارع"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="buildingName">اسم المبنى</Label>
            <Input
              id="buildingName"
              value={formData.buildingName}
              onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
              placeholder="اختياري"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buildingNumber">رقم المبنى</Label>
            <Input
              id="buildingNumber"
              value={formData.buildingNumber}
              onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
              placeholder="اختياري"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="floor">الطابق</Label>
            <Input
              id="floor"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              placeholder="اختياري"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="officeNumber">رقم المكتب</Label>
            <Input
              id="officeNumber"
              value={formData.officeNumber}
              onChange={(e) => setFormData({ ...formData, officeNumber: e.target.value })}
              placeholder="اختياري"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">الهاتف *</Label>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+962 00 000 0000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

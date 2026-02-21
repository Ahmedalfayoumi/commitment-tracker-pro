import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RegisterCompanyFormData } from "@/components/register-company/types";

interface CompanyBasicInfoSectionProps {
  formData: RegisterCompanyFormData;
  setFormData: (data: RegisterCompanyFormData) => void;
  companyTypes: Array<string>;
}

export function CompanyBasicInfoSection({
  formData,
  setFormData,
  companyTypes,
}: CompanyBasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>معلومات الشركة الأساسية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nameAr">اسم الشركة (عربي) *</Label>
            <Input
              id="nameAr"
              required
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder="أدخل اسم الشركة بالعربية"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameEn">اسم الشركة (إنجليزي) *</Label>
            <Input
              id="nameEn"
              required
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="Enter company name in English"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyType">نوع الشركة *</Label>
          <Select
            value={formData.companyType || undefined}
            onValueChange={(value) => setFormData({ ...formData, companyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع الشركة" />
            </SelectTrigger>
            <SelectContent>
              {companyTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
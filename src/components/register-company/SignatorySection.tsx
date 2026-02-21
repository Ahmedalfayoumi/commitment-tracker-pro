import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterCompanyFormData } from "@/components/register-company/types";

interface SignatorySectionProps {
  formData: RegisterCompanyFormData;
  setFormData: (data: RegisterCompanyFormData) => void;
}

export function SignatorySection({ formData, setFormData }: SignatorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>المفوض بالتوقيع</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signatoryName">اسم المفوض *</Label>
            <Input
              id="signatoryName"
              required
              value={formData.signatoryName}
              onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
              placeholder="أدخل اسم المفوض بالتوقيع"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signatoryPhone">هاتف المفوض *</Label>
            <Input
              id="signatoryPhone"
              required
              value={formData.signatoryPhone}
              onChange={(e) => setFormData({ ...formData, signatoryPhone: e.target.value })}
              placeholder="+962 00 000 0000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

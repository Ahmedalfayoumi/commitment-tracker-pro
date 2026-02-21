import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegisterCompanyFormData } from "@/components/register-company/types";

interface UserCreationSectionProps {
  formData: RegisterCompanyFormData;
  setFormData: (data: RegisterCompanyFormData) => void;
}

export function UserCreationSection({ formData, setFormData }: UserCreationSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          حساب مدير الشركة
        </CardTitle>
        <CardDescription>
          قم بإنشاء حساب للمدير المسؤول عن هذه الشركة ليتمكن من الدخول وإدارة الالتزامات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adminName">اسم المدير الكامل *</Label>
            <Input
              id="adminName"
              required
              value={formData.adminName || ""}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              placeholder="أدخل اسم المدير"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminUsername">اسم المستخدم *</Label>
            <Input
              id="adminUsername"
              required
              value={formData.adminUsername || ""}
              onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
              placeholder="مثال: ahmed_admin"
              dir="ltr"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminPassword">كلمة المرور *</Label>
          <div className="relative">
            <Input
              id="adminPassword"
              type={showPassword ? "text" : "password"}
              required
              value={formData.adminPassword || ""}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              placeholder="••••••••"
              dir="ltr"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            يجب أن تكون كلمة المرور قوية وسهلة التذكر للمدير
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
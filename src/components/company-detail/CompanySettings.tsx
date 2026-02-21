import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload } from "lucide-react";
import { toast } from "sonner";

interface CompanySettingsProps {
  company: any;
}

export function CompanySettings({ company }: CompanySettingsProps) {
  const updateCompany = useMutation(api.companies.updateCompany);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const [isUpdating, setIsUpdating] = useState(false);
  const [colors, setColors] = useState({
    primaryColor: company?.primaryColor || "#3b82f6",
    secondaryColor: company?.secondaryColor || "#1e293b",
  });

  useEffect(() => {
    if (company) {
      setColors({
        primaryColor: company.primaryColor || "#3b82f6",
        secondaryColor: company.secondaryColor || "#1e293b",
      });
    }
  }, [company]);

  const handleUpdateColors = async () => {
    try {
      setIsUpdating(true);
      await updateCompany({
        companyId: company._id,
        primaryColor: colors.primaryColor,
        secondaryColor: colors.secondaryColor,
      });
      toast.success("تم تحديث الألوان بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث الألوان");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("يرجى اختيار ملف بصيغة JPG أو PNG فقط");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }

    try {
      setIsUpdating(true);
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await updateCompany({
        companyId: company._id,
        [type === "logo" ? "logoStorageId" : "faviconStorageId"]: storageId,
      });

      toast.success(`تم تحديث ${type === "logo" ? "الشعار" : "الأيقونة"} بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الملف");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            ألوان الهوية
          </CardTitle>
          <CardDescription>اختر ألوان السمة الخاصة بالشركة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="primaryColor">اللون الأساسي</Label>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: colors.primaryColor }} />
                <Input
                  id="primaryColor"
                  type="color"
                  className="w-12 h-12 p-1 cursor-pointer"
                  value={colors.primaryColor}
                  onChange={(e) => setColors({ ...colors, primaryColor: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="secondaryColor">اللون الثانوي</Label>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: colors.secondaryColor }} />
                <Input
                  id="secondaryColor"
                  type="color"
                  className="w-12 h-12 p-1 cursor-pointer"
                  value={colors.secondaryColor}
                  onChange={(e) => setColors({ ...colors, secondaryColor: e.target.value })}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleUpdateColors} disabled={isUpdating} className="w-full">
            حفظ الألوان
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            الوسائط والشعار
          </CardTitle>
          <CardDescription>تحديث شعار الشركة وأيقونة الموقع (JPG/PNG, max 5MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>شعار الشركة</Label>
              <div className="flex items-center gap-4">
                {company?.logoUrl && (
                  <img src={company.logoUrl} alt="Logo" className="w-12 h-12 rounded object-cover border" />
                )}
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "logo");
                  }}
                  disabled={isUpdating}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>أيقونة الموقع (Favicon)</Label>
              <div className="flex items-center gap-4">
                {company?.faviconUrl && (
                  <img src={company.faviconUrl} alt="Favicon" className="w-8 h-8 rounded object-cover border" />
                )}
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "favicon");
                  }}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

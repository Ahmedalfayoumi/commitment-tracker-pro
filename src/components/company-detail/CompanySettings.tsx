import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Upload, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CompanySettingsProps {
  company: any;
}

const PLAN_LABELS: Record<string, string> = {
  "1month": "شهر واحد",
  "3months": "3 أشهر",
  "6months": "6 أشهر",
  "1year": "سنة كاملة",
};

function SubscriptionStatus({ company }: { company: any }) {
  if (!company?.subscriptionExpiry) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span>لا يوجد اشتراك نشط</span>
      </div>
    );
  }

  const now = Date.now();
  const expiry = company.subscriptionExpiry;
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  const isExpired = expiry < now;
  const isExpiringSoon = !isExpired && daysLeft <= 7;

  const expiryDate = new Date(expiry).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isExpired) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">منتهي الصلاحية</Badge>
        <span className="text-sm text-muted-foreground">انتهى في {expiryDate}</span>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-yellow-500 text-white">ينتهي قريباً</Badge>
        <span className="text-sm text-muted-foreground">
          {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"} متبقية — {expiryDate}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-green-500 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        نشط
      </Badge>
      <span className="text-sm text-muted-foreground">
        {daysLeft} يوم متبقي — ينتهي {expiryDate}
      </span>
    </div>
  );
}

export function CompanySettings({ company }: CompanySettingsProps) {
  const updateCompany = useMutation(api.companies.updateCompany);
  const setSubscription = useMutation(api.companies.setSubscription);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const currentUser = useQuery(api.users.currentUser);

  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [colors, setColors] = useState({
    primaryColor: company?.primaryColor || "#3b82f6",
    secondaryColor: company?.secondaryColor || "#1e293b",
  });

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

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

  const handleSetSubscription = async () => {
    if (!selectedPlan) {
      toast.error("يرجى اختيار خطة الاشتراك");
      return;
    }
    try {
      setIsUpdating(true);
      const newExpiry = await setSubscription({
        companyId: company._id,
        plan: selectedPlan as any,
      });
      const expiryDate = new Date(newExpiry).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      toast.success(`تم تفعيل الاشتراك حتى ${expiryDate}`);
      setSelectedPlan("");
    } catch (error) {
      toast.error("حدث خطأ أثناء تفعيل الاشتراك");
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
      {/* Subscription Card - Admin Only */}
      {isAdmin && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              إدارة الاشتراك
            </CardTitle>
            <CardDescription>تحديد وتمديد فترة صلاحية استخدام التطبيق للشركة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">الحالة الحالية:</span>
              <SubscriptionStatus company={company} />
              {company?.subscriptionPlan && (
                <Badge variant="outline" className="mr-auto">
                  {PLAN_LABELS[company.subscriptionPlan] || company.subscriptionPlan}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="mb-2 block">اختر خطة الاشتراك</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">شهر واحد (30 يوم)</SelectItem>
                    <SelectItem value="3months">3 أشهر (90 يوم)</SelectItem>
                    <SelectItem value="6months">6 أشهر (180 يوم)</SelectItem>
                    <SelectItem value="1year">سنة كاملة (365 يوم)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSetSubscription}
                  disabled={isUpdating || !selectedPlan}
                  className="w-full sm:w-auto"
                >
                  {company?.subscriptionExpiry && company.subscriptionExpiry > Date.now()
                    ? "تمديد الاشتراك"
                    : "تفعيل الاشتراك"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * إذا كان هناك اشتراك نشط، سيتم التمديد من تاريخ انتهاء الاشتراك الحالي.
            </p>
          </CardContent>
        </Card>
      )}

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
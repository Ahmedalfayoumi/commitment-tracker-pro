import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

const COMPANY_TYPES = [
  "شركة مساهمة عامة",
  "شركة مساهمة خاصة",
  "شركة ذات مسؤولية محدودة",
  "مؤسسة فردية",
  "شركة تضامن",
];

const SECTORS = [
  { value: "commercial", label: "تجاري" },
  { value: "service", label: "خدمي" },
  { value: "industrial", label: "صناعي" },
  { value: "health", label: "صحي" },
  { value: "hospitality", label: "ضيافة" },
  { value: "realEstate", label: "عقاري" },
  { value: "telecommunications", label: "اتصالات" },
  { value: "it", label: "تكنولوجيا المعلومات" },
  { value: "mining", label: "تعدين" },
  { value: "education", label: "تعليم" },
  { value: "agriculture", label: "زراعة" },
  { value: "tourism", label: "سياحة" },
  { value: "pharmaceutical", label: "صيدلة" },
  { value: "foodIndustries", label: "صناعات غذائية" },
  { value: "oilGas", label: "نفط وغاز" },
  { value: "textiles", label: "نسيج" },
];

export default function RegisterCompany() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const registerCompany = useMutation(api.companies.registerCompany);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);

  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
    companyType: "",
    sectors: [] as Array<string>,
    country: "",
    city: "",
    street: "",
    buildingName: "",
    buildingNumber: "",
    floor: "",
    officeNumber: "",
    phone: "",
    signatoryName: "",
    signatoryPhone: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  const handleSectorToggle = (sector: string) => {
    setFormData((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter((s) => s !== sector)
        : [...prev.sectors, sector],
    }));
  };

  const uploadFile = async (file: File): Promise<Id<"_storage"> | undefined> => {
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Error uploading file:", error);
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoStorageId: Id<"_storage"> | undefined;
      let faviconStorageId: Id<"_storage"> | undefined;

      if (logoFile) {
        logoStorageId = await uploadFile(logoFile);
      }

      if (faviconFile) {
        faviconStorageId = await uploadFile(faviconFile);
      }

      const companyId = await registerCompany({
        ...formData,
        logoStorageId,
        faviconStorageId,
      });

      toast.success("تم تسجيل الشركة بنجاح");
      navigate(`/company/${companyId}`);
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الشركة");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                تسجيل شركة جديدة
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                أدخل بيانات الشركة لإنشاء حساب جديد
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Company Names */}
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
                      value={formData.companyType}
                      onValueChange={(value) => setFormData({ ...formData, companyType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الشركة" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Sectors */}
              <Card>
                <CardHeader>
                  <CardTitle>قطاعات الشركة</CardTitle>
                  <CardDescription>اختر القطاعات التي تعمل بها الشركة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SECTORS.map((sector) => (
                      <div key={sector.value} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={sector.value}
                          checked={formData.sectors.includes(sector.value)}
                          onCheckedChange={() => handleSectorToggle(sector.value)}
                        />
                        <Label htmlFor={sector.value} className="cursor-pointer">
                          {sector.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Address Details */}
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

              {/* Authorized Signatory */}
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

              {/* Logo & Favicon */}
              <Card>
                <CardHeader>
                  <CardTitle>شعار الشركة والأيقونة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">شعار الشركة</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon">أيقونة الموقع (Favicon)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="favicon"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>جاري الحفظ...</>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      حفظ الشركة
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

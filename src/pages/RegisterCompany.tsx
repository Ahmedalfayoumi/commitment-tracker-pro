import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import type { RegisterCompanyFormData } from "@/components/register-company/types";
import { CompanyBasicInfoSection } from "@/components/register-company/CompanyBasicInfoSection";
import { SectorsSection } from "@/components/register-company/SectorsSection";
import { AddressSection } from "@/components/register-company/AddressSection";
import { SignatorySection } from "@/components/register-company/SignatorySection";
import { LogoSection } from "@/components/register-company/LogoSection";
import { RegisterCompanyActions } from "@/components/register-company/RegisterCompanyActions";
import { useQuery } from "convex/react";
import { ROLES } from "@/convex/schema";

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
  const user = useQuery(api.users.currentUser);
  const navigate = useNavigate();
  const registerCompany = useMutation(api.companies.registerCompany);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);

  const [formData, setFormData] = useState<RegisterCompanyFormData>({
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

  if (user && user.role !== ROLES.ADMIN) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">غير مصرح لك</h1>
        <p className="text-muted-foreground mb-4">فقط مدير النظام يمكنه تسجيل شركات جديدة.</p>
        <Button onClick={() => navigate("/dashboard")}>العودة للوحة التحكم</Button>
      </div>
    );
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
              <CompanyBasicInfoSection
                formData={formData}
                setFormData={setFormData}
                companyTypes={COMPANY_TYPES}
              />

              <SectorsSection
                sectors={SECTORS}
                selectedSectors={formData.sectors}
                onToggle={handleSectorToggle}
              />

              <AddressSection formData={formData} setFormData={setFormData} />

              <SignatorySection formData={formData} setFormData={setFormData} />

              <LogoSection setLogoFile={setLogoFile} setFaviconFile={setFaviconFile} />

              <RegisterCompanyActions
                isSubmitting={isSubmitting}
                onCancel={() => navigate("/dashboard")}
              />
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
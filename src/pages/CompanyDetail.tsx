import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Plus, DollarSign, FileText, Calendar, Filter, Search, Settings, Upload, Palette, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/company-detail/SummaryCards";
import { CommitmentFilters } from "@/components/company-detail/CommitmentFilters";
import { CommitmentList } from "@/components/company-detail/CommitmentList";

const STATUS_COLORS = {
  active: "bg-blue-500",
  postponed: "bg-yellow-500",
  paid: "bg-green-500",
  partialPaid: "bg-orange-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS = {
  active: "نشط",
  postponed: "مؤجل",
  paid: "مدفوع",
  partialPaid: "مدفوع جزئياً",
  cancelled: "ملغي",
};

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const company = useQuery(api.companies.getCompanyById, 
    companyId ? { companyId: companyId as Id<"companies"> } : "skip"
  );
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
  
  const availableMonths = useQuery(api.commitments.getCommitmentMonths, 
    companyId ? { companyId: companyId as Id<"companies"> } : "skip"
  );

  const commitments = useQuery(
    api.commitments.getCommitments,
    companyId ? { 
      companyId: companyId as Id<"companies">, 
      searchQuery, 
      month: selectedMonth === "all" ? undefined : selectedMonth 
    } : "skip"
  );

  const createCommitment = useMutation(api.commitments.createCommitment);
  const createPayment = useMutation(api.payments.createPayment);
  const updateCompany = useMutation(api.companies.updateCompany);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);

  const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<Id<"commitments"> | null>(null);

  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    primaryColor: company?.primaryColor || "#3b82f6",
    secondaryColor: company?.secondaryColor || "#1e293b",
  });

  // Update settings form when company data loads
  useEffect(() => {
    if (company) {
      setSettingsForm({
        primaryColor: company.primaryColor || "#3b82f6",
        secondaryColor: company.secondaryColor || "#1e293b",
      });
    }
  }, [company]);

  const [commitmentForm, setCommitmentForm] = useState({
    dueDate: "",
    account: "",
    description: "",
    amount: "",
    status: "active" as const,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash" as const,
    paymentDate: "",
    notes: "",
  });

  const validateFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error("يرجى اختيار ملف بصيغة JPG أو PNG فقط");
      return false;
    }
    if (file.size > maxSize) {
      toast.error("حجم الملف يجب أن لا يتجاوز 5 ميجابايت");
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
    if (!validateFile(file)) return;

    try {
      setIsUpdatingSettings(true);
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await updateCompany({
        companyId: companyId as Id<"companies">,
        [type === "logo" ? "logoStorageId" : "faviconStorageId"]: storageId,
      });

      toast.success(`تم تحديث ${type === "logo" ? "الشعار" : "الأيقونة"} بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الملف");
      console.error(error);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleUpdateColors = async () => {
    try {
      setIsUpdatingSettings(true);
      await updateCompany({
        companyId: companyId as Id<"companies">,
        primaryColor: settingsForm.primaryColor,
        secondaryColor: settingsForm.secondaryColor,
      });
      toast.success("تم تحديث الألوان بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث الألوان");
      console.error(error);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

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

  if (!company && !isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-muted-foreground">404</div>
          <div className="text-xl text-muted-foreground">الشركة غير موجودة</div>
          <Button onClick={() => navigate("/dashboard")}>العودة للوحة التحكم</Button>
        </div>
      </div>
    );
  }

  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCommitment({
        companyId: companyId as Id<"companies">,
        dueDate: new Date(commitmentForm.dueDate).getTime(),
        account: commitmentForm.account,
        description: commitmentForm.description,
        amount: parseFloat(commitmentForm.amount),
        status: commitmentForm.status,
      });
      toast.success("تم إنشاء الالتزام بنجاح");
      setIsCommitmentDialogOpen(false);
      setCommitmentForm({
        dueDate: "",
        account: "",
        description: "",
        amount: "",
        status: "active",
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء الالتزام");
      console.error(error);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitment) return;

    try {
      await createPayment({
        commitmentId: selectedCommitment,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: new Date(paymentForm.paymentDate).getTime(),
        notes: paymentForm.notes,
      });
      toast.success("تم تسجيل الدفعة بنجاح");
      setIsPaymentDialogOpen(false);
      setSelectedCommitment(null);
      setPaymentForm({
        amount: "",
        paymentMethod: "cash",
        paymentDate: "",
        notes: "",
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدفعة");
      console.error(error);
    }
  };

  const totalCommitments = commitments?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const totalPaid = commitments?.reduce((sum, c) => sum + c.paidAmount, 0) || 0;
  const totalRemaining = totalCommitments - totalPaid;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="flex-1 flex items-center gap-4">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.nameAr} className="w-20 h-20 rounded-xl object-cover shadow-md border" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center border">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {company?.nameAr}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">{company?.nameEn}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="commitments" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="commitments" className="gap-2">
              <FileText className="h-4 w-4" />
              الالتزامات
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commitments" className="space-y-6">
            <SummaryCards 
              totalCommitments={totalCommitments} 
              totalPaid={totalPaid} 
              totalRemaining={totalRemaining} 
            />

            <CommitmentFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableMonths={availableMonths}
              onAddClick={() => setIsCommitmentDialogOpen(true)}
            />

            <CommitmentList 
              commitments={commitments as any}
              onRecordPayment={(id) => {
                setSelectedCommitment(id);
                setIsPaymentDialogOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Colors */}
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
                        <div 
                          className="w-8 h-8 rounded border" 
                          style={{ backgroundColor: settingsForm.primaryColor }} 
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          className="w-12 h-12 p-1 cursor-pointer"
                          value={settingsForm.primaryColor}
                          onChange={(e) => setSettingsForm({ ...settingsForm, primaryColor: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded border" 
                          style={{ backgroundColor: settingsForm.secondaryColor }} 
                        />
                        <Input
                          id="secondaryColor"
                          type="color"
                          className="w-12 h-12 p-1 cursor-pointer"
                          value={settingsForm.secondaryColor}
                          onChange={(e) => setSettingsForm({ ...settingsForm, secondaryColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpdateColors} 
                    disabled={isUpdatingSettings}
                    className="w-full"
                  >
                    حفظ الألوان
                  </Button>
                </CardContent>
              </Card>

              {/* Assets Upload */}
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
                          disabled={isUpdatingSettings}
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
                          disabled={isUpdatingSettings}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Commitment Dialog */}
        <Dialog open={isCommitmentDialogOpen} onOpenChange={setIsCommitmentDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة التزام جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCommitment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    required
                    value={commitmentForm.dueDate}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    value={commitmentForm.amount}
                    onChange={(e) => setCommitmentForm({ ...commitmentForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account">الحساب *</Label>
                <Input
                  id="account"
                  required
                  value={commitmentForm.account}
                  onChange={(e) => setCommitmentForm({ ...commitmentForm, account: e.target.value })}
                  placeholder="مثال: ضريبة الدخل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف *</Label>
                <Textarea
                  id="description"
                  required
                  value={commitmentForm.description}
                  onChange={(e) => setCommitmentForm({ ...commitmentForm, description: e.target.value })}
                  placeholder="أدخل تفاصيل الالتزام"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCommitmentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ الالتزام</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تسجيل دفعة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">المبلغ *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value: any) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="bankTransfer">تحويل بنكي</SelectItem>
                    <SelectItem value="creditCard">بطاقة ائتمان</SelectItem>
                    <SelectItem value="clique">كليك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">تاريخ الدفع *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="ملاحظات إضافية (اختياري)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">حفظ الدفعة</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
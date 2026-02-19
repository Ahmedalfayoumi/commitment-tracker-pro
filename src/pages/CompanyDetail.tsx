import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Plus, DollarSign, FileText, Calendar, Filter, Search } from "lucide-react";
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
  
  const commitments = useQuery(
    api.commitments.getCommitments,
    companyId ? { companyId: companyId as Id<"companies">, searchQuery, month: selectedMonth } : "skip"
  );

  const createCommitment = useMutation(api.commitments.createCommitment);
  const createPayment = useMutation(api.payments.createPayment);

  const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<Id<"commitments"> | null>(null);

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

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">الشركة غير موجودة</div>
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
            <div className="flex-1">
              <div className="flex items-center gap-4">
                {company.logoUrl && (
                  <img src={company.logoUrl} alt={company.nameAr} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    {company.nameAr}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">{company.nameEn}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الالتزامات</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCommitments.toFixed(2)} د.أ</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المدفوع</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} د.أ</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المتبقي</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalRemaining.toFixed(2)} د.أ</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الالتزامات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="تصفية حسب الشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأشهر</SelectItem>
                  {/* Add month options dynamically */}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCommitmentDialogOpen} onOpenChange={setIsCommitmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة التزام جديد
                </Button>
              </DialogTrigger>
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
          </div>

          {/* Commitments List */}
          <div className="space-y-4">
            {commitments?.map((commitment) => (
              <Card key={commitment._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{commitment.commitmentNumber}</h3>
                        <Badge className={STATUS_COLORS[commitment.status]}>
                          {STATUS_LABELS[commitment.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{commitment.account}</p>
                      <p className="text-sm mb-4">{commitment.description}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(commitment.dueDate).toLocaleDateString("ar-JO")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>المبلغ: {commitment.amount.toFixed(2)} د.أ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">المدفوع: {commitment.paidAmount.toFixed(2)} د.أ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">المتبقي: {(commitment.amount - commitment.paidAmount).toFixed(2)} د.أ</span>
                        </div>
                      </div>
                    </div>
                    {commitment.status !== "paid" && commitment.status !== "cancelled" && (
                      <Button
                        onClick={() => {
                          setSelectedCommitment(commitment._id);
                          setIsPaymentDialogOpen(true);
                        }}
                        size="sm"
                      >
                        تسجيل دفعة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
    </div>
  );
}

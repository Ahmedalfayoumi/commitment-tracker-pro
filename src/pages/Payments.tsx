import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { CreditCard, Plus, Search, Calendar, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Payments() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCommitmentId = searchParams.get("commitmentId") as Id<"commitments"> | null;

  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    commitmentId: "" as string,
    amount: "",
    paymentMethod: "cash" as const,
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const payments = useQuery(api.payments.getAllUserPayments);
  const pendingCommitments = useQuery(api.commitments.getPendingCommitments);
  const createPayment = useMutation(api.payments.createPayment);

  useEffect(() => {
    if (initialCommitmentId) {
      setForm(prev => ({ ...prev, commitmentId: initialCommitmentId }));
      setIsRecordDialogOpen(true);
    }
  }, [initialCommitmentId]);

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" />;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.commitmentId) {
      toast.error("يرجى اختيار الالتزام");
      return;
    }
    setIsSubmitting(true);
    try {
      await createPayment({
        commitmentId: form.commitmentId as Id<"commitments">,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        paymentDate: new Date(form.paymentDate).getTime(),
        notes: form.notes,
      });
      toast.success("تم تسجيل الدفعة بنجاح");
      setIsRecordDialogOpen(false);
      setForm({
        commitmentId: "",
        amount: "",
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدفعة");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              المدفوعات
            </h1>
            <p className="text-muted-foreground mt-1">سجل وتابع جميع الدفعات المالية</p>
          </div>
          <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                تسجيل دفعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">تسجيل دفعة مالية</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRecordPayment} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>الالتزام المستهدف *</Label>
                  <Select 
                    value={form.commitmentId} 
                    onValueChange={(val) => setForm({ ...form, commitmentId: val })}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الالتزام..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingCommitments?.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.commitmentNumber} - {c.account} ({c.companyName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المبلغ *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>طريقة الدفع *</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(val: any) => setForm({ ...form, paymentMethod: val })}
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
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الدفع *</Label>
                  <Input
                    type="date"
                    required
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "جاري الحفظ..." : "تأكيد الدفع"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل المدفوعات الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">الالتزام</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">
                        {new Date(payment.paymentDate).toLocaleDateString("ar-JO")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {payment.companyName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{payment.commitmentNumber}</span>
                          <span className="text-xs text-muted-foreground">{payment.commitmentAccount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell className="text-left font-bold text-green-600">
                        {payment.amount.toFixed(2)} د.أ
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد مدفوعات مسجلة بعد
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

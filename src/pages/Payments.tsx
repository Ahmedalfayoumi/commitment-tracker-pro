import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { CreditCard, Plus, Search, Eye, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { formatAmount, formatDate } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { PaymentDialog } from "@/components/company-detail/PaymentDialog";

export default function Payments() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"paymentDate" | "companyName" | "amount">("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const payments = useQuery(api.payments.getAllUserPayments);
  const deletePayment = useMutation(api.payments.deletePayment);

  const filteredPayments = payments?.filter((p) => {
    const search = searchQuery.toLowerCase();
    return (
      p.commitmentNumber?.toLowerCase().includes(search) ||
      p.commitmentAccount?.toLowerCase().includes(search) ||
      p.companyName?.toLowerCase().includes(search) ||
      p.notes?.toLowerCase().includes(search)
    );
  });

  const sortedPayments = filteredPayments ? [...filteredPayments].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "paymentDate") {
      comparison = a.paymentDate - b.paymentDate;
    } else if (sortBy === "companyName") {
      comparison = (a.companyName || "").localeCompare(b.companyName || "");
    } else if (sortBy === "amount") {
      comparison = a.amount - b.amount;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  }) : [];

  const handleDelete = async (id: Id<"payments">) => {
    try {
      await deletePayment({ paymentId: id });
      toast.success("تم حذف الدفعة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الدفعة");
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
            <p className="text-muted-foreground mt-1">سجل وتتبع جميع المدفوعات المالية</p>
          </div>
          <Button 
            onClick={() => {
              setSelectedPayment(null);
              setIsPaymentDialogOpen(true);
            }} 
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            تسجيل دفعة جديدة
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المدفوعات، الشركات، أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue placeholder="فرز حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paymentDate">تاريخ الدفع</SelectItem>
                <SelectItem value="companyName">اسم الشركة</SelectItem>
                <SelectItem value="amount">المبلغ</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""} transition-transform`} />
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {sortedPayments?.map((payment) => (
            <Card key={payment._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{payment.commitmentNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        {payment.companyName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {payment.paymentMethod === "cash" ? "نقداً" : 
                         payment.paymentMethod === "bankTransfer" ? "تحويل بنكي" :
                         payment.paymentMethod === "creditCard" ? "بطاقة ائتمان" : "كليك"}
                      </Badge>
                    </div>
                    <p className="font-medium">{payment.commitmentAccount}</p>
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col md:items-end justify-between gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatAmount(payment.amount)} د.أ
                      </div>
                      <div className="text-xs text-muted-foreground">
                        تاريخ الدفع: {formatDate(payment.paymentDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsPaymentDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف هذه الدفعة نهائياً. سيتم تحديث حالة الالتزام المرتبط تلقائياً.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(payment._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {sortedPayments?.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">لا توجد مدفوعات مطابقة للبحث</p>
            </div>
          )}
        </div>
      </motion.div>

      <PaymentDialog 
        isOpen={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen} 
        payment={selectedPayment} 
      />

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الدفعة</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">التاريخ:</span>
                <span className="col-span-2">{formatDate(selectedPayment.paymentDate)}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">المبلغ:</span>
                <span className="col-span-2">{formatAmount(selectedPayment.amount)} د.أ</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">طريقة الدفع:</span>
                <span className="col-span-2">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">ملاحظات:</span>
                <span className="col-span-2">{selectedPayment.notes || "-"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
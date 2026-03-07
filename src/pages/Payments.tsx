import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { CreditCard, Plus, Search, Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

type SortField = "paymentDate" | "companyName" | "amount";
type SortOrder = "asc" | "desc";

const SORT_LABELS: Record<SortField, string> = {
  paymentDate: "تاريخ الدفع",
  companyName: "اسم الشركة",
  amount: "المبلغ",
};

export default function Payments() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("paymentDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const payments = useQuery(api.payments.getAllUserPayments);
  const deletePayment = useMutation(api.payments.deletePayment);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortOrder === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

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

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المدفوعات، الشركات، أو الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Table View */}
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <div className="flex flex-row items-center bg-muted/50 px-4 py-3 border-b min-w-max" dir="rtl">
              {(["commitmentNumber", "companyName", "paymentMethod", "amount", "paymentDate", "notes", "actions"] as const).map((col) => {
                const sortableFields: Record<string, SortField | null> = {
                  commitmentNumber: null,
                  companyName: "companyName",
                  paymentMethod: null,
                  amount: "amount",
                  paymentDate: "paymentDate",
                  notes: null,
                  actions: null,
                };
                const labels: Record<string, string> = {
                  commitmentNumber: "رقم الالتزام",
                  companyName: "الشركة",
                  paymentMethod: "طريقة الدفع",
                  amount: "المبلغ",
                  paymentDate: "تاريخ الدفع",
                  notes: "ملاحظات",
                  actions: "",
                };
                const widths: Record<string, string> = {
                  commitmentNumber: "w-[140px]",
                  companyName: "w-[140px]",
                  paymentMethod: "w-[120px]",
                  amount: "w-[110px]",
                  paymentDate: "w-[120px]",
                  notes: "w-[180px]",
                  actions: "w-[120px]",
                };
                const sortField = sortableFields[col];
                return (
                  <div
                    key={col}
                    className={`${widths[col]} shrink-0 text-xs font-bold text-muted-foreground uppercase tracking-wide ${sortField ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
                    onClick={() => sortField && handleSort(sortField)}
                  >
                    <div className="flex items-center gap-1">
                      {labels[col]}
                      {sortField && <SortIcon field={sortField} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Rows */}
            <div className="min-w-max divide-y">
              {sortedPayments?.map((payment, index) => (
                <div
                  key={payment._id}
                  className={`flex flex-row items-center py-3 px-4 text-sm transition-colors ${
                    index % 2 === 0
                      ? "bg-white hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/20"
                      : "bg-muted/20 hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20"
                  }`}
                  dir="rtl"
                >
                  <div className="w-[140px] shrink-0">
                    <span className="font-semibold text-primary text-xs">{payment.commitmentNumber}</span>
                  </div>
                  <div className="w-[140px] shrink-0">
                    <Badge variant="outline" className="text-[10px]">{payment.companyName}</Badge>
                  </div>
                  <div className="w-[120px] shrink-0 text-xs text-muted-foreground">
                    {payment.paymentMethod === "cash" ? "نقداً" :
                     payment.paymentMethod === "bankTransfer" ? "تحويل بنكي" :
                     payment.paymentMethod === "creditCard" ? "بطاقة ائتمان" : "كليك"}
                  </div>
                  <div className="w-[110px] shrink-0 font-bold text-green-600 text-xs">
                    {formatAmount(payment.amount)} د.أ
                  </div>
                  <div className="w-[120px] shrink-0 text-xs text-muted-foreground">
                    {formatDate(payment.paymentDate)}
                  </div>
                  <div className="w-[180px] shrink-0 text-xs text-muted-foreground truncate">
                    {payment.notes || "-"}
                  </div>
                  <div className="w-[120px] shrink-0 flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
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
              ))}
              {sortedPayments?.length === 0 && (
                <div className="text-center py-16 px-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">لا توجد مدفوعات مطابقة للبحث</p>
                </div>
              )}
            </div>
          </div>
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
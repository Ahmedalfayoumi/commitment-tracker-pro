import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { CreditCard, Plus, Search, Calendar, Building2, FileText, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function PaymentsPage() {
  const payments = useQuery(api.payments.getAllUserPayments);
  const deletePayment = useMutation(api.payments.deletePayment);
  const user = useQuery(api.users.currentUser);
  
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleDelete = async (id: Id<"payments">) => {
    try {
      await deletePayment({ paymentId: id });
      toast.success("تم حذف الدفعة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الدفعة");
    }
  };

  const isSystemAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              المدفوعات
            </h1>
            <p className="text-muted-foreground mt-1">سجل وتابع جميع الدفعات المالية</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right">رقم الالتزام</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{payment.companyName}</TableCell>
                    <TableCell>{payment.commitmentNumber}</TableCell>
                    <TableCell className="font-bold">{formatAmount(payment.amount)} د.أ</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedPayment(payment);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Only show edit/delete for admins */}
                        {(isSystemAdmin || payment.userRole === "admin") && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setSelectedPayment(payment);
                              setIsEditDialogOpen(true);
                            }}>
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
                                    سيتم حذف هذه الدفعة نهائياً وتحديث رصيد الالتزام.
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <PaymentDialog 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
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
    </DashboardLayout>
  );
}
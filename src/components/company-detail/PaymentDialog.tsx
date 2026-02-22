import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  commitmentId?: Id<"commitments">;
  amountDue?: number;
  payment?: any;
}

export function PaymentDialog({
  isOpen,
  onOpenChange,
  commitmentId: initialCommitmentId,
  amountDue,
  payment,
}: PaymentDialogProps) {
  const createPayment = useMutation(api.payments.createPayment);
  const updatePayment = useMutation(api.payments.updatePayment);
  
  // Fetch commitments for selection if no commitmentId is provided (global add)
  const allCommitments = useQuery(api.commitments.getAllUserCommitments, {});
  
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string>(initialCommitmentId || "");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setPaymentMethod(payment.paymentMethod);
      setPaymentDate(new Date(payment.paymentDate));
      setNotes(payment.notes || "");
      setSelectedCommitmentId(payment.commitmentId);
    } else {
      if (initialCommitmentId) {
        setSelectedCommitmentId(initialCommitmentId);
      } else {
        setSelectedCommitmentId("");
      }
      
      if (amountDue !== undefined) {
        setAmount(amountDue.toString());
      } else {
        setAmount("");
      }
      setPaymentMethod("cash");
      setPaymentDate(new Date());
      setNotes("");
    }
  }, [payment, amountDue, initialCommitmentId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment && !selectedCommitmentId) {
      toast.error("يرجى اختيار الالتزام");
      return;
    }

    setIsSubmitting(true);
    try {
      if (payment) {
        await updatePayment({
          paymentId: payment._id,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod as any,
          paymentDate: paymentDate.getTime(),
          notes,
        });
        toast.success("تم تحديث الدفعة بنجاح");
      } else {
        await createPayment({
          commitmentId: selectedCommitmentId as Id<"commitments">,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod as any,
          paymentDate: paymentDate.getTime(),
          notes,
        });
        toast.success("تم تسجيل الدفعة بنجاح");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء العملية");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {payment ? "تعديل دفعة" : "تسجيل دفعة جديدة"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!payment && !initialCommitmentId && (
            <div className="space-y-2">
              <Label>الالتزام *</Label>
              <Select
                value={selectedCommitmentId}
                onValueChange={setSelectedCommitmentId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الالتزام..." />
                </SelectTrigger>
                <SelectContent>
                  {allCommitments?.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.commitmentNumber} - {c.account} ({c.companyName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">المبلغ *</Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: any) => setPaymentMethod(value)}
              disabled={isSubmitting}
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
              value={paymentDate.toISOString().split("T")[0]}
              onChange={(e) => setPaymentDate(new Date(e.target.value))}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية (اختياري)"
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "جاري الحفظ..." : (payment ? "حفظ التغييرات" : "تسجيل الدفعة")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
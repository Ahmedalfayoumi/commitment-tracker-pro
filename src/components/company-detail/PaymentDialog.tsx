import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  commitmentId: Id<"commitments"> | null;
  defaultAmount?: number; // Added to allow pre-filling
}

export function PaymentDialog({ isOpen, onOpenChange, commitmentId, defaultAmount }: PaymentDialogProps) {
  const createPayment = useMutation(api.payments.createPayment);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "cash" as const,
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Update amount when defaultAmount or isOpen changes
  useEffect(() => {
    if (isOpen && defaultAmount !== undefined) {
      setForm(prev => ({ ...prev, amount: defaultAmount.toString() }));
    }
  }, [isOpen, defaultAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitmentId) return;
    setIsLoading(true);
    try {
      await createPayment({
        commitmentId,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        paymentDate: new Date(form.paymentDate).getTime(),
        notes: form.notes,
      });
      toast.success("تم تسجيل الدفعة بنجاح");
      onOpenChange(false);
      setForm({
        amount: "",
        paymentMethod: "cash",
        paymentDate: "",
        notes: "",
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدفعة");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">المبلغ *</Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(value: any) => setForm({ ...form, paymentMethod: value })}
              disabled={isLoading}
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
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="ملاحظات إضافية (اختياري)"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ الدفعة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
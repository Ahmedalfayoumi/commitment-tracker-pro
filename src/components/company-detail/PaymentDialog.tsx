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
import { Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
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
      setSearchTerm("");
      
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

  const filteredCommitments = allCommitments?.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      c.commitmentNumber.toLowerCase().includes(search) ||
      c.account.toLowerCase().includes(search) ||
      (c.companyName && c.companyName.toLowerCase().includes(search))
    );
  });

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
              <Label>البحث عن الالتزام واختياره *</Label>
              <div className="relative mb-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم الالتزام، الحساب، أو الشركة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  disabled={isSubmitting}
                />
              </div>
              <Select
                value={selectedCommitmentId}
                onValueChange={setSelectedCommitmentId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={searchTerm ? "اختر من نتائج البحث..." : "اختر الالتزام..."} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCommitments && filteredCommitments.length > 0 ? (
                    filteredCommitments.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.commitmentNumber} - {c.account} ({c.companyName})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {searchTerm ? "لا توجد نتائج للبحث" : "جاري تحميل الالتزامات..."}
                    </div>
                  )}
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
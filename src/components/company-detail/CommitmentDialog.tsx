import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CommitmentStatus = "active" | "postponed" | "paid" | "partialPaid" | "cancelled";

interface CommitmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
  commitment?: any; // Add commitment prop for editing
}

export function CommitmentDialog({ isOpen, onOpenChange, companyId, commitment }: CommitmentDialogProps) {
  const createCommitment = useMutation(api.commitments.createCommitment);
  const updateCommitment = useMutation(api.commitments.updateCommitment);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState<{
    dueDate: string;
    account: string;
    description: string;
    amount: string;
    status: CommitmentStatus;
  }>({
    dueDate: "",
    account: "",
    description: "",
    amount: "",
    status: "active",
  });

  // Reset form when commitment changes or dialog opens
  useEffect(() => {
    if (commitment && isOpen) {
      setForm({
        dueDate: new Date(commitment.dueDate).toISOString().split('T')[0],
        account: commitment.account || "",
        description: commitment.description || "",
        amount: commitment.amount?.toString() || "",
        status: (commitment.status as CommitmentStatus) || "active",
      });
    } else if (isOpen) {
      setForm({
        dueDate: "",
        account: "",
        description: "",
        amount: "",
        status: "active",
      });
    }
  }, [commitment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (commitment) {
        await updateCommitment({
          commitmentId: commitment._id,
          dueDate: new Date(form.dueDate).getTime(),
          account: form.account,
          description: form.description,
          amount: parseFloat(form.amount),
          status: form.status,
        });
        toast.success("تم تحديث الالتزام بنجاح");
      } else {
        await createCommitment({
          companyId,
          dueDate: new Date(form.dueDate).getTime(),
          account: form.account,
          description: form.description,
          amount: parseFloat(form.amount),
          status: form.status,
        });
        toast.success("تم إنشاء الالتزام بنجاح");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الالتزام");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{commitment ? "تعديل الالتزام" : "إضافة التزام جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
              <Input
                id="dueDate"
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">الحساب *</Label>
            <Input
              id="account"
              required
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
              placeholder="مثال: ضريبة الدخل"
              disabled={isLoading}
            />
          </div>
          {commitment && (
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select 
                value={form.status} 
                onValueChange={(v: CommitmentStatus) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="postponed">مؤجل</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="partialPaid">مدفوع جزئياً</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="أدخل تفاصيل الالتزام"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ الالتزام"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
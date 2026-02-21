import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CommitmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
}

export function CommitmentDialog({ isOpen, onOpenChange, companyId }: CommitmentDialogProps) {
  const createCommitment = useMutation(api.commitments.createCommitment);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    dueDate: "",
    account: "",
    description: "",
    amount: "",
    status: "active" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createCommitment({
        companyId,
        dueDate: new Date(form.dueDate).getTime(),
        account: form.account,
        description: form.description,
        amount: parseFloat(form.amount),
        status: form.status,
      });
      toast.success("تم إنشاء الالتزام بنجاح");
      onOpenChange(false);
      setForm({
        dueDate: "",
        account: "",
        description: "",
        amount: "",
        status: "active",
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء الالتزام");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة التزام جديد</DialogTitle>
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

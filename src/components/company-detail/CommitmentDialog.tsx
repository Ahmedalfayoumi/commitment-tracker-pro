import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

type CommitmentStatus = "active" | "postponed" | "paid" | "partialPaid" | "cancelled";

interface CommitmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
  commitment?: any;
}

export function CommitmentDialog({ isOpen, onOpenChange, companyId, commitment }: CommitmentDialogProps) {
  const createCommitment = useMutation(api.commitments.createCommitment);
  const updateCommitment = useMutation(api.commitments.updateCommitment);
  const createAccount = useMutation(api.accounts.createAccount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");

  const accounts = useQuery(
    api.accounts.getCompanyAccounts,
    companyId ? { companyId } : "skip"
  );

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
    setIsAddingAccount(false);
    setNewAccountName("");
  }, [commitment, isOpen]);

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error("يرجى إدخال اسم الحساب");
      return;
    }
    setIsLoading(true);
    try {
      await createAccount({ name: newAccountName.trim(), companyId });
      setForm((f) => ({ ...f, account: newAccountName.trim() }));
      setNewAccountName("");
      setIsAddingAccount(false);
      toast.success("تم إضافة الحساب بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء إضافة الحساب");
    } finally {
      setIsLoading(false);
    }
  };

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
            {isAddingAccount ? (
              <div className="flex gap-2">
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="اسم الحساب الجديد"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAccount())}
                  autoFocus
                />
                <Button type="button" onClick={handleAddAccount} disabled={isLoading} size="sm">
                  إضافة
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingAccount(false)} disabled={isLoading} size="sm">
                  إلغاء
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={form.account}
                  onValueChange={(v) => setForm({ ...form, account: v })}
                  required
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر الحساب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a._id} value={a.name}>{a.name}</SelectItem>
                    ))}
                    {accounts?.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">لا توجد حسابات، أضف حساباً جديداً</div>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddingAccount(true)}
                  disabled={isLoading}
                  title="إضافة حساب جديد"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
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
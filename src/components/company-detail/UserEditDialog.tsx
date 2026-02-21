import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { KeyRound } from "lucide-react";

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: Id<"companies">;
  user: {
    _id: Id<"users">;
    name: string;
    username: string;
    companyUserRole: "admin" | "user";
    companyUserId: Id<"companyUsers">;
  } | null;
}

export function UserEditDialog({
  isOpen,
  onOpenChange,
  companyId,
  user,
}: UserEditDialogProps) {
  const updateCompanyUser = useMutation(api.companies.updateCompanyUser);
  const resetPassword = useMutation(api.users.adminResetPassword);
  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState<"admin" | "user">(user?.companyUserRole || "user");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.companyUserRole);
      setNewPassword("");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateCompanyUser({
        companyUserId: user.companyUserId,
        name,
        role,
      });

      if (newPassword) {
        await resetPassword({
          userId: user._id,
          newPassword,
          companyId,
        });
      }

      toast.success("تم تحديث بيانات المستخدم بنجاح");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("حدث خطأ أثناء تحديث بيانات المستخدم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل المستخدم</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              value={user?.username || ""}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">الدور</Label>
            <Select value={role} onValueChange={(value: "admin" | "user") => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مسؤول</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="newPassword" title="اتركه فارغاً لعدم التغيير">
              تغيير كلمة المرور (اختياري)
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة مرور جديدة"
              />
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
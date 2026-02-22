import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  companyId: Id<"companies">;
}

export function UserEditDialog({ isOpen, onOpenChange, user, companyId }: UserEditDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<"companies">>(companyId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCompanyUser = useMutation(api.companies.updateCompanyUser);
  const companies = useQuery(api.companies.getUserCompanies);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setRole(user.companyUserRole || "user");
      setSelectedCompanyId(companyId);
    }
  }, [user, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateCompanyUser({
        companyUserId: user.companyUserId,
        name,
        role,
        companyId: selectedCompanyId,
      });
      toast.success("تم تحديث بيانات المستخدم بنجاح");
      onOpenChange(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث بيانات المستخدم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <Label htmlFor="role">الصلاحية</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">الشركة</Label>
            <Select 
              value={selectedCompanyId} 
              onValueChange={(v: any) => setSelectedCompanyId(v as Id<"companies">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map((company) => (
                  <SelectItem key={company._id} value={company._id}>
                    {company.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
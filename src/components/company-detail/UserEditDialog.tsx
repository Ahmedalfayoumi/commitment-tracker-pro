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
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCompanyUser = useMutation(api.companies.updateCompanyUser);
  const positions = useQuery(api.permissions.getPositions, { companyId });
  const userPositions = useQuery(api.permissions.getUserPositions, { companyId });

  useEffect(() => {
    if (user && userPositions) {
      setName(user.name || "");
      // Find the current position for this user
      const userPos = userPositions.find((up) => up.userId === user._id);
      setSelectedPositionId(userPos?.positionId || "none");
    }
  }, [user, userPositions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateCompanyUser({
        companyUserId: user.companyUserId,
        name,
        positionId: selectedPositionId && selectedPositionId !== "none" 
          ? selectedPositionId as Id<"positions"> 
          : undefined,
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
            <Label htmlFor="position">المنصب والصلاحيات</Label>
            <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنصب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون منصب</SelectItem>
                {positions?.map((position) => (
                  <SelectItem key={position._id} value={position._id}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPositionId && selectedPositionId !== "none" && positions && (
              <p className="text-xs text-muted-foreground">
                الصلاحيات: {positions.find(p => p._id === selectedPositionId)?.permissions?.length || 0} صلاحية
              </p>
            )}
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
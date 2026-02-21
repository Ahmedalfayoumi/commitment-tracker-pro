import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Trash2, Shield, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyUsersSectionProps {
  companyId: Id<"companies">;
  isAdmin: boolean;
}

export function CompanyUsersSection({ companyId, isAdmin }: CompanyUsersSectionProps) {
  const users = useQuery(api.companies.getCompanyUsers, { companyId });
  const addMember = useMutation(api.companies.addCompanyUser);
  const removeMember = useMutation(api.companies.removeCompanyUser);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "admin" | "user",
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addMember({
        companyId,
        ...formData,
      });
      toast.success("تم إضافة المستخدم بنجاح");
      setIsAddDialogOpen(false);
      setFormData({ name: "", username: "", password: "", role: "user" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء إضافة المستخدم");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (companyUserId: Id<"companyUsers">) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم من الشركة؟")) return;
    try {
      await removeMember({ companyUserId });
      toast.success("تم حذف المستخدم من الشركة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء الحذف");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مستخدمي الشركة</h2>
          <p className="text-muted-foreground">إدارة الوصول والصلاحيات لموظفي الشركة</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد للشركة</DialogTitle>\
                <DialogDescription>أدخل بيانات الحساب الجديد للموظف</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الموظف"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="مثال: ali_2024"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">الصلاحية</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">مستخدم (عرض وإضافة التزامات)</SelectItem>
                      <SelectItem value="admin">مسؤول (إدارة كاملة للشركة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ المستخدم"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">اسم المستخدم</TableHead>
              <TableHead className="text-right">الصلاحية</TableHead>
              {isAdmin && <TableHead className="text-left">الإجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name || "بدون اسم"}</TableCell>
                <TableCell dir="ltr" className="text-right">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.companyUserRole === "admin" ? "default" : "secondary"} className="gap-1">
                    {user.companyUserRole === "admin" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {user.companyUserRole === "admin" ? "مسؤول" : "مستخدم"}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveUser(user.companyUserId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  لا يوجد مستخدمين مضافين حالياً
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

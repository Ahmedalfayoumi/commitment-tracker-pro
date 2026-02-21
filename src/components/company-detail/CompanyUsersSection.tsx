import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, PlusCircle, Trash2, Edit, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserEditDialog } from "./UserEditDialog";

interface CompanyUsersSectionProps {
  companyId: Id<"companies">;
  isAdmin: boolean;
}

export function CompanyUsersSection({
  companyId,
  isAdmin,
}: CompanyUsersSectionProps) {
  const companyUsers = useQuery(api.companies.getCompanyUsers, { companyId });
  const addCompanyUser = useAction(api.companies.addCompanyUser);
  const removeCompanyUser = useMutation(api.companies.removeCompanyUser);

  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUserToView, setSelectedUserToView] = useState<any | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      await addCompanyUser({
        companyId,
        name: newUserName,
        username: newUserUsername,
        password: newUserPassword,
        role: newUserRole,
      });
      toast.success("تم إضافة المستخدم بنجاح");
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
      setNewUserRole("user");
      setIsAddUserDialogOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("حدث خطأ أثناء إضافة المستخدم");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (companyUserId: Id<"companyUsers">) => {
    try {
      await removeCompanyUser({ companyUserId });
      toast.success("تم حذف المستخدم بنجاح");
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error(error.message || "حدث خطأ أثناء حذف المستخدم");
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleViewUser = (user: any) => {
    setSelectedUserToView(user);
    setIsViewDialogOpen(true);
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">مستخدمو الشركة</CardTitle>
        {isAdmin && (
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  إضافة مستخدم
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    الاسم
                  </Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    اسم المستخدم
                  </Label>
                  <Input
                    id="username"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    الدور
                  </Label>
                  <Select
                    value={newUserRole}
                    onValueChange={(value: "admin" | "user") =>
                      setNewUserRole(value)
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مسؤول</SelectItem>
                      <SelectItem value="user">مستخدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAddingUser}>
                    {isAddingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "إضافة"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {companyUsers && companyUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">اسم المستخدم</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyUsers.map((user: any) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.companyUserRole === "admin" 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {user.companyUserRole === "admin" ? "مسؤول" : "مستخدم"}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewUser(user)}
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    هل أنت متأكد؟
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم حذف المستخدم "{user.name}" من هذه الشركة.
                                    لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRemoveUser(user.companyUserId)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <CardDescription className="text-center py-4">
            لا يوجد مستخدمون مسجلون لهذه الشركة.
          </CardDescription>
        )}
      </CardContent>

      <UserEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUserToEdit}
        companyId={companyId}
      />

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
          </DialogHeader>
          {selectedUserToView && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">الاسم:</span>
                <span className="col-span-2">{selectedUserToView.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">اسم المستخدم:</span>
                <span className="col-span-2">{selectedUserToView.username}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">الدور في الشركة:</span>
                <span className="col-span-2">
                  {selectedUserToView.companyUserRole === "admin" ? "مسؤول" : "مستخدم"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="font-bold">تاريخ الانضمام:</span>
                <span className="col-span-2">
                  {new Date(selectedUserToView._creationTime).toLocaleDateString("ar-JO")}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
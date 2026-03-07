import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { motion } from "framer-motion";
import { BookOpen, Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Accounts() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountName, setAccountName] = useState("");
  const [dialogCompanyId, setDialogCompanyId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const companies = useQuery(api.companies.getUserCompanies);
  const accounts = useQuery(api.accounts.getAllUserAccounts);
  const createAccount = useMutation(api.accounts.createAccount);
  const updateAccount = useMutation(api.accounts.updateAccount);
  const deleteAccount = useMutation(api.accounts.deleteAccount);

  const filteredAccounts = accounts?.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = selectedCompanyId === "all" || a.companyId === selectedCompanyId;
    return matchesSearch && matchesCompany;
  });

  const openAddDialog = () => {
    setEditingAccount(null);
    setAccountName("");
    setDialogCompanyId(companies?.[0]?._id || "");
    setIsDialogOpen(true);
  };

  const openEditDialog = (account: any) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setDialogCompanyId(account.companyId);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!accountName.trim() || !dialogCompanyId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setIsSaving(true);
    try {
      if (editingAccount) {
        await updateAccount({ accountId: editingAccount._id, name: accountName });
        toast.success("تم تحديث الحساب بنجاح");
      } else {
        await createAccount({ name: accountName, companyId: dialogCompanyId as Id<"companies"> });
        toast.success("تم إضافة الحساب بنجاح");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ الحساب");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"accounts">) => {
    try {
      await deleteAccount({ accountId: id });
      toast.success("تم حذف الحساب بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الحساب");
    }
  };

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" />;

  return (
    <div className="p-6 lg:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              الحسابات
            </h1>
            <p className="text-muted-foreground mt-1">إدارة حسابات الالتزامات لشركاتك</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-5 w-5" />
            إضافة حساب جديد
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الحسابات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="جميع الشركات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الشركات</SelectItem>
              {companies?.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.nameAr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center bg-muted/50 px-6 py-3 border-b text-xs font-bold text-muted-foreground uppercase tracking-wide">
            <div className="flex-1">اسم الحساب</div>
            <div className="w-[160px]">الشركة</div>
            <div className="w-[100px] text-left">الإجراءات</div>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {filteredAccounts?.map((account, index) => (
              <motion.div
                key={account._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center px-6 py-4 text-sm transition-colors ${
                  index % 2 === 0
                    ? "bg-white hover:bg-muted/30 dark:bg-card dark:hover:bg-muted/20"
                    : "bg-muted/10 hover:bg-muted/30 dark:bg-muted/5 dark:hover:bg-muted/20"
                }`}
              >
                <div className="flex-1 font-medium">{account.name}</div>
                <div className="w-[160px]">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Building2 className="h-3 w-3" />
                    {account.companyName}
                  </Badge>
                </div>
                <div className="w-[100px] flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => openEditDialog(account)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>سيتم حذف هذا الحساب نهائياً.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(account._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
            {filteredAccounts?.length === 0 && (
              <div className="text-center py-16 px-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">لا توجد حسابات مطابقة</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  إضافة حساب جديد
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "تعديل الحساب" : "إضافة حساب جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingAccount && (
              <div className="space-y-2">
                <Label>الشركة *</Label>
                <Select value={dialogCompanyId} onValueChange={setDialogCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشركة" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>اسم الحساب *</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="مثال: ضريبة الدخل"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>إلغاء</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

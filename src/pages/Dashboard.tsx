import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Building2, Plus, Users, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const companies = useQuery(api.companies.getUserCompanies);
  const deleteCompany = useMutation(api.companies.deleteCompany);
  const navigate = useNavigate();

  const handleDeleteCompany = async (companyId: any) => {
    try {
      await deleteCompany({ companyId });
      toast.success("تم حذف الشركة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الشركة");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 lg:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              لوحة التحكم الرئيسية
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              إدارة الشركات والالتزامات المالية الخاصة بك
            </p>
          </div>
          {isAdmin && (
            <Link to="/register-company">
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-5 w-5" />
                تسجيل شركة جديدة
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الشركات</CardTitle>
          </CardHeader>
          <CardContent>
            {!companies ? (
              <div className="flex justify-center py-8">جاري التحميل...</div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">لا توجد شركات مسجلة</h3>
                <p className="text-muted-foreground mb-4">ابدأ بتسجيل شركتك الأولى</p>
                {isAdmin && (
                  <Link to="/register-company">
                    <Button variant="outline">تسجيل شركة</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشركة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الدور</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company: any) => (
                      <TableRow key={company._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logoUrl ? (
                              <img
                                src={company.logoUrl}
                                alt={company.nameAr}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{company.nameAr}</div>
                              <div className="text-xs text-muted-foreground">{company.nameEn}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{company.companyType}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            company.userRole === "admin" 
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {company.userRole === "admin" ? "مدير" : "مستخدم"}
                          </span>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/company/${company._id}`)}
                              title="عرض"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {company.userRole === "admin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/company/${company._id}?tab=settings`)}
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      سيتم حذف شركة "{company.nameAr}" وجميع البيانات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCompany(company._id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
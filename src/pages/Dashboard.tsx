import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, Link } from "react-router";
import { motion } from "framer-motion";
import { Building2, Plus, Users, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const companies = useQuery(api.companies.getUserCompanies);

  // Auth and loading are now handled by DashboardLayout
  
  return (
    <div className="p-6 lg:p-8">
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
          <Link to="/register-company">
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-5 w-5" />
              تسجيل شركة جديدة
            </Button>
          </Link>
        </div>

        {companies && companies.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد شركات مسجلة</h3>
              <p className="text-muted-foreground mb-6 text-center">
                ابدأ بتسجيل شركتك الأولى لإدارة الالتزامات المالية
              </p>
              <Link to="/register-company">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  تسجيل شركة جديدة
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies?.map((company: any) => (
              <motion.div
                key={company._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/company/${company._id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.nameAr}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{company.nameAr}</CardTitle>
                          <CardDescription className="text-sm">
                            {company.nameEn}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{company.companyType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>الدور: {company.userRole === "admin" ? "مدير" : "مستخدم"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
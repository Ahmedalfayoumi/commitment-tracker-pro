import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useParams, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Plus, DollarSign, FileText, Calendar, Filter, Search, Settings, Upload, Palette, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/company-detail/SummaryCards";
import { CommitmentFilters } from "@/components/company-detail/CommitmentFilters";
import { CommitmentList } from "@/components/company-detail/CommitmentList";
import { CommitmentDialog } from "@/components/company-detail/CommitmentDialog";
import { PaymentDialog } from "@/components/company-detail/PaymentDialog";
import { CompanySettings } from "@/components/company-detail/CompanySettings";
import { CompanyUsersSection } from "@/components/company-detail/CompanyUsersSection";
import { UserEditDialog } from "@/components/company-detail/UserEditDialog";

const STATUS_COLORS = {
  active: "bg-blue-500",
  postponed: "bg-yellow-500",
  paid: "bg-green-500",
  partialPaid: "bg-orange-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS = {
  active: "نشط",
  postponed: "مؤجل",
  paid: "مدفوع",
  partialPaid: "مدفوع جزئياً",
  cancelled: "ملغي",
};

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "commitments";
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const company = useQuery(api.companies.getCompanyById, 
    companyId ? { companyId: companyId as Id<"companies"> } : "skip"
  );
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
  
  const availableMonths = useQuery(api.commitments.getCommitmentMonths, 
    companyId ? { companyId: companyId as Id<"companies"> } : "skip"
  );

  const commitments = useQuery(
    api.commitments.getCommitments,
    companyId ? { 
      companyId: companyId as Id<"companies">, 
      searchQuery, 
      month: selectedMonth === "all" ? undefined : selectedMonth 
    } : "skip"
  );

  const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<Id<"commitments"> | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  if (!company && !isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-muted-foreground">404</div>
          <div className="text-xl text-muted-foreground">الشركة غير موجودة</div>
          <Button onClick={() => navigate("/dashboard")}>العودة للوحة التحكم</Button>
        </div>
      </div>
    );
  }

  const totalCommitments = commitments?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
  const totalPaid = commitments?.reduce((sum: number, c: any) => sum + c.paidAmount, 0) || 0;
  const totalRemaining = totalCommitments - totalPaid;

  return (
    <div className="p-6 lg:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="flex-1 flex items-center gap-4">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.nameAr} className="w-20 h-20 rounded-xl object-cover shadow-md border" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center border">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {company?.nameAr}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">الشركة: {company?.nameEn}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
            <TabsTrigger value="commitments" className="gap-2">
              <FileText className="h-4 w-4" />
              الالتزامات
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commitments" className="space-y-6">
            <SummaryCards
              totalCommitments={totalCommitments}
              totalPaid={totalPaid}
              totalRemaining={totalRemaining}
            />

            <CommitmentFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableMonths={availableMonths}
              onAddClick={() => setIsCommitmentDialogOpen(true)}
            />

            <CommitmentList
              commitments={commitments as any}
              onRecordPayment={(id) => {
                setSelectedCommitment(id);
                setIsPaymentDialogOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="users">
            <CompanyUsersSection
              companyId={companyId as Id<"companies">}
              isAdmin={company?.userRole === "admin"}
            />
          </TabsContent>

          <TabsContent value="settings">
            <CompanySettings company={company} />
          </TabsContent>
        </Tabs>

        <CommitmentDialog
          isOpen={isCommitmentDialogOpen}
          onOpenChange={setIsCommitmentDialogOpen}
          companyId={companyId as Id<"companies">}
        />

        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          commitmentId={selectedCommitment}
        />
      </motion.div>
    </div>
  );
}
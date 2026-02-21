import { useState } from "react";
import { useQuery } from "convex/react";
import { useAction } from "convex/react";
import * as XLSX from "xlsx";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { FileText, Plus, Search, CreditCard, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommitmentDialog } from "@/components/company-detail/CommitmentDialog";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

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

export default function Commitments() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<"companies"> | null>(null);
  const importCommitments = useAction(api.excel.importCommitments);
  const [isImporting, setIsImporting] = useState(false);

  const commitments = useQuery(api.commitments.getAllUserCommitments, {
    searchQuery,
    status: statusFilter,
  });

  const companies = useQuery(api.companies.getUserCompanies);

  const downloadTemplate = () => {
    const template = [
      {
        "الحساب": "مثال: شركة الكهرباء",
        "الوصف": "فاتورة شهر يناير",
        "المبلغ": 150.50,
        "تاريخ الاستحقاق": "2024-01-25",
        "الحالة": "نشط"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "commitments_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompanyId && companies?.length === 0) return;

    const companyId = selectedCompanyId || (companies?.[0]?._id as Id<"companies">);
    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        const result = await importCommitments({
          companyId,
          fileData: base64,
        });

        if (result.success) {
          toast.success(`تم استيراد ${result.importedCount} التزام بنجاح`);
          if (result.errors) {
            console.error("Import errors:", result.errors);
            toast.warning("تم الاستيراد مع وجود بعض الأخطاء، راجع وحدة التحكم");
          }
        } else {
          toast.error(`فشل الاستيراد: ${result.error}`);
        }
        setIsImporting(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("حدث خطأ أثناء قراءة الملف");
      setIsImporting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" />;

  return (
    <div className="p-6 lg:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              الالتزامات
            </h1>
            <p className="text-muted-foreground mt-1">إدارة جميع الالتزامات المالية عبر شركاتك</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              تحميل النموذج
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                disabled={isImporting}
              />
              <Button variant="outline" className="gap-2" disabled={isImporting}>
                <Upload className="h-4 w-4" />
                {isImporting ? "جاري الاستيراد..." : "استيراد من Excel"}
              </Button>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              إضافة التزام جديد
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الالتزامات أو الشركات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {commitments?.map((commitment) => (
            <Card key={commitment._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{commitment.commitmentNumber}</span>
                      <Badge className={STATUS_COLORS[commitment.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[commitment.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {commitment.companyName}
                      </Badge>
                    </div>
                    <p className="font-medium">{commitment.account}</p>
                    <p className="text-sm text-muted-foreground">{commitment.description}</p>
                  </div>
                  <div className="flex flex-col md:items-end justify-between gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-primary">
                        {commitment.amount.toFixed(2)} د.أ
                      </div>
                      <div className="text-xs text-muted-foreground">
                        تاريخ الاستحقاق: {new Date(commitment.dueDate).toLocaleDateString("ar-JO")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {commitment.status !== "paid" && commitment.status !== "cancelled" && (
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate(`/payments?commitmentId=${commitment._id}`)}
                        >
                          <CreditCard className="h-4 w-4" />
                          تسجيل دفعة
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/company/${commitment.companyId}`)}
                      >
                        عرض الشركة
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {commitments?.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">لا توجد التزامات مطابقة للبحث</p>
            </div>
          )}
        </div>

        {/* Add Commitment Dialog - Needs company selection first if not in context */}
        <CommitmentDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          companyId={selectedCompanyId || (companies?.[0]?._id as Id<"companies">)}
        />
      </motion.div>
    </div>
  );
}
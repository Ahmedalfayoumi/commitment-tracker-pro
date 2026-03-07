import { useState } from "react";
import { useQuery } from "convex/react";
import { useAction, useMutation } from "convex/react";
import * as XLSX from "xlsx";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { FileText, Plus, Search, CreditCard, Upload, Download, FileSpreadsheet, Eye, Edit, Trash2, Calendar, ArrowUpDown, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommitmentList } from "@/components/company-detail/CommitmentList";
import { CommitmentDialog } from "@/components/company-detail/CommitmentDialog";
import { PaymentDialog } from "@/components/company-detail/PaymentDialog";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { formatAmount, formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

type SortField = "dueDate" | "companyName" | "amount" | "commitmentNumber" | "status";

// Arabic month names
const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

// Generate month options for the last 2 years + next year
function generateMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const startYear = now.getFullYear() - 1;
  const endYear = now.getFullYear() + 1;
  for (let year = endYear; year >= startYear; year--) {
    for (let month = 11; month >= 0; month--) {
      const value = `${year}-${String(month + 1).padStart(2, "0")}`;
      options.push({ value, label: `${ARABIC_MONTHS[month]} ${year}` });
    }
  }
  return options;
}

const MONTH_OPTIONS = generateMonthOptions();

export default function Commitments() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<Id<"commitments"> | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<"companies"> | null>(null);
  const [editingCommitment, setEditingCommitment] = useState<any>(null);
  const [viewingCommitment, setViewingCommitment] = useState<any>(null);

  // Date filter state
  const [dateFilterMode, setDateFilterMode] = useState<"none" | "months" | "range">("none");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const currentUser = useQuery(api.users.currentUser);
  const isSystemAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const importCommitments = useAction(api.excel.importCommitments);
  const deleteCommitment = useMutation(api.commitments.deleteCommitment);
  const [isImporting, setIsImporting] = useState(false);

  const commitments = useQuery(api.commitments.getAllUserCommitments, {
    searchQuery,
    status: statusFilter,
  });

  // Filter out paid commitments - they only appear in Payments page
  const filteredCommitments = commitments
    ?.filter(c => c.status !== "paid")
    ?.filter(c => {
      if (dateFilterMode === "months" && selectedMonths.length > 0) {
        const d = new Date(c.dueDate);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return selectedMonths.includes(monthKey);
      }
      if (dateFilterMode === "range") {
        if (dateFrom && c.dueDate < dateFrom.getTime()) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (c.dueDate > endOfDay.getTime()) return false;
        }
        return true;
      }
      return true;
    });

  const hasDateFilter = dateFilterMode !== "none" && (
    (dateFilterMode === "months" && selectedMonths.length > 0) ||
    (dateFilterMode === "range" && (dateFrom || dateTo))
  );

  const clearDateFilter = () => {
    setDateFilterMode("none");
    setSelectedMonths([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const selectedCommitment = filteredCommitments?.find((c) => c._id === selectedCommitmentId);
  const selectedAmountDue = selectedCommitment
    ? selectedCommitment.amount - (selectedCommitment.paidAmount || 0)
    : undefined;

  const companies = useQuery(api.companies.getUserCompanies);

  const handleDelete = async (id: Id<"commitments">) => {
    try {
      await deleteCommitment({ commitmentId: id });
      toast.success("تم حذف الالتزام بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الالتزام");
    }
  };

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

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الالتزامات أو الشركات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={hasDateFilter ? "default" : "outline"}
                className={cn("gap-2 min-w-[130px]", hasDateFilter && "bg-primary text-primary-foreground")}
              >
                <Calendar className="h-4 w-4" />
                {hasDateFilter
                  ? dateFilterMode === "months"
                    ? `${selectedMonths.length} شهر`
                    : "نطاق تاريخ"
                  : "فلتر التاريخ"}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-4" align="end" dir="rtl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">فلتر بالتاريخ</h3>
                  {hasDateFilter && (
                    <Button variant="ghost" size="sm" onClick={clearDateFilter} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                      <X className="h-3 w-3 ml-1" />
                      مسح
                    </Button>
                  )}
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={dateFilterMode === "months" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setDateFilterMode(dateFilterMode === "months" ? "none" : "months")}
                  >
                    اختيار أشهر
                  </Button>
                  <Button
                    variant={dateFilterMode === "range" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setDateFilterMode(dateFilterMode === "range" ? "none" : "range")}
                  >
                    نطاق تاريخ
                  </Button>
                </div>

                {/* Month Picker */}
                {dateFilterMode === "months" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">اختر شهراً أو أكثر:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                      {MONTH_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => toggleMonth(opt.value)}
                          className={cn(
                            "w-full text-right text-sm px-3 py-1.5 rounded-md transition-colors",
                            selectedMonths.includes(opt.value)
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {selectedMonths.length > 0 && (
                      <p className="text-xs text-primary font-medium">
                        تم اختيار {selectedMonths.length} شهر
                      </p>
                    )}
                  </div>
                )}

                {/* Date Range Picker */}
                {dateFilterMode === "range" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">من تاريخ:</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "اختر تاريخ البداية"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">إلى تاريخ:</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy") : "اختر تاريخ النهاية"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {dateFilterMode !== "none" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setDateFilterOpen(false)}
                  >
                    تطبيق الفلتر
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter badge */}
          {hasDateFilter && (
            <Button variant="ghost" size="sm" onClick={clearDateFilter} className="gap-1 text-xs text-muted-foreground hover:text-destructive px-2">
              <X className="h-3 w-3" />
              مسح الفلتر
            </Button>
          )}
        </div>

        <CommitmentList
          commitments={filteredCommitments as any}
          onRecordPayment={(id) => {
            setSelectedCommitmentId(id);
            setIsPaymentDialogOpen(true);
          }}
          onEdit={setEditingCommitment}
          onDelete={handleDelete}
          onView={setViewingCommitment}
          isAdmin={isSystemAdmin}
          showCompanyName={true}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Add/Edit Commitment Dialog */}
        <CommitmentDialog
          isOpen={isAddDialogOpen || !!editingCommitment}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingCommitment(null);
            }
          }}
          companyId={editingCommitment?.companyId || selectedCompanyId || (companies?.[0]?._id as Id<"companies">)}
          commitment={editingCommitment}
        />

        {/* Payment Dialog */}
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          commitmentId={selectedCommitmentId ?? undefined}
          amountDue={selectedAmountDue}
        />

        {/* View Commitment Dialog */}
        <Dialog open={!!viewingCommitment} onOpenChange={(open) => !open && setViewingCommitment(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تفاصيل الالتزام</DialogTitle>
            </DialogHeader>
            {viewingCommitment && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">الرقم:</span>
                  <span className="col-span-2">{viewingCommitment.commitmentNumber}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">الشركة:</span>
                  <span className="col-span-2">{viewingCommitment.companyName}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">الحساب:</span>
                  <span className="col-span-2">{viewingCommitment.account}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">المبلغ:</span>
                  <span className="col-span-2">{formatAmount(viewingCommitment.amount)} د.أ</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">المدفوع:</span>
                  <span className="col-span-2 text-green-600">{formatAmount(viewingCommitment.paidAmount)} د.أ</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">المتبقي:</span>
                  <span className="col-span-2 text-red-600">{formatAmount(viewingCommitment.amount - viewingCommitment.paidAmount)} د.أ</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">تاريخ الاستحقاق:</span>
                  <span className="col-span-2">{formatDate(viewingCommitment.dueDate)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">الحالة:</span>
                  <span className="col-span-2">
                    <Badge className={STATUS_COLORS[viewingCommitment.status as keyof typeof STATUS_COLORS]}>
                      {STATUS_LABELS[viewingCommitment.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="font-bold">الوصف:</span>
                  <span className="col-span-2">{viewingCommitment.description}</span>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setViewingCommitment(null)}>إغلاق</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
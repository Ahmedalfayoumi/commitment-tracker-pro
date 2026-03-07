import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Eye, Edit, Trash2, LayoutGrid, List, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { formatAmount, formatDate, getDaysUntil } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  postponed: "bg-yellow-100 text-yellow-700 border-yellow-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  partialPaid: "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  postponed: "مؤجل",
  paid: "مدفوع",
  partialPaid: "مدفوع جزئياً",
  cancelled: "ملغي",
};

interface Commitment {
  _id: Id<"commitments">;
  commitmentNumber: string;
  status: string;
  account: string;
  description: string;
  dueDate: number;
  amount: number;
  paidAmount: number;
  companyName?: string;
}

interface CommitmentListProps {
  commitments: Commitment[] | undefined;
  onRecordPayment: (id: Id<"commitments">) => void;
  onEdit?: (commitment: any) => void;
  onDelete?: (id: Id<"commitments">) => void;
  onView?: (commitment: any) => void;
  isAdmin?: boolean;
  showCompanyName?: boolean;
}

const HEADERS = [
  { label: "رقم الالتزام", width: "w-[130px]" },
  { label: "تاريخ الاستحقاق", width: "w-[120px]" },
  { label: "الحساب", width: "w-[130px]" },
  { label: "البيان", width: "w-[180px]" },
  { label: "القيمة", width: "w-[100px]" },
  { label: "الحالة", width: "w-[110px]" },
  { label: "المدفوع", width: "w-[100px]" },
  { label: "طريقة الدفع", width: "w-[100px]" },
  { label: "تاريخ السداد", width: "w-[110px]" },
  { label: "الرصيد", width: "w-[100px]" },
  { label: "", width: "w-[130px]" },
];

export function CommitmentList({
  commitments,
  onRecordPayment,
  onEdit,
  onDelete,
  onView,
  isAdmin,
  showCompanyName = false,
}: CommitmentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("commitmentViewMode");
    return (saved as "grid" | "list") || "list";
  });

  useEffect(() => {
    localStorage.setItem("commitmentViewMode", viewMode);
  }, [viewMode]);

  const getDueDateStyle = (days: number) => {
    if (days < 0) return { dot: "bg-red-500", text: "text-red-600 font-semibold" };
    if (days === 0) return { dot: "bg-red-500", text: "text-red-600 font-semibold" };
    if (days <= 3) return { dot: "bg-orange-400", text: "text-orange-600 font-medium" };
    if (days <= 7) return { dot: "bg-yellow-400", text: "text-yellow-600" };
    return { dot: "bg-green-400", text: "text-foreground" };
  };

  const isOverdue = (commitment: Commitment) => {
    const days = getDaysUntil(commitment.dueDate);
    const amountDue = commitment.amount - commitment.paidAmount;
    return days < 0 && amountDue > 0;
  };

  const overdueCommitments = commitments?.filter(isOverdue) || [];
  const regularCommitments = commitments?.filter((c) => !isOverdue(c)) || [];

  const renderListRow = (commitment: Commitment, index: number) => {
    const daysUntil = getDaysUntil(commitment.dueDate);
    const dueDateStyle = getDueDateStyle(daysUntil);
    const overdue = isOverdue(commitment);
    const amountDue = commitment.amount - commitment.paidAmount;

    return (
      <div
        key={commitment._id}
        className={cn(
          "flex flex-row items-center py-3 px-4 text-sm transition-colors border-b last:border-b-0",
          overdue
            ? "bg-red-50/60 hover:bg-red-50 dark:bg-red-950/10 dark:hover:bg-red-950/20"
            : index % 2 === 0
            ? "bg-white hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/20"
            : "bg-muted/20 hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20"
        )}
        dir="rtl"
      >
        {/* رقم الالتزام */}
        <div className={cn(HEADERS[0].width, "shrink-0 flex items-center gap-2")}>
          <div className={cn("w-2 h-2 rounded-full shrink-0", dueDateStyle.dot)} />
          <span className={cn("font-semibold text-primary truncate text-xs", overdue && "text-red-600")}>
            {commitment.commitmentNumber}
          </span>
        </div>

        {/* تاريخ الاستحقاق */}
        <div className={cn(HEADERS[1].width, "shrink-0", dueDateStyle.text, "text-xs")}>
          {formatDate(commitment.dueDate)}
        </div>

        {/* الحساب */}
        <div className={cn(HEADERS[2].width, "shrink-0 truncate font-medium text-xs")}>
          {commitment.account}
          {showCompanyName && commitment.companyName && (
            <div className="text-[10px] text-muted-foreground truncate">{commitment.companyName}</div>
          )}
        </div>

        {/* البيان */}
        <div className={cn(HEADERS[3].width, "shrink-0 truncate text-muted-foreground text-xs")}>
          {commitment.description}
        </div>

        {/* القيمة */}
        <div className={cn(HEADERS[4].width, "shrink-0 font-bold text-foreground text-xs")}>
          {formatAmount(commitment.amount)}
        </div>

        {/* الحالة */}
        <div className={cn(HEADERS[5].width, "shrink-0")}>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-2 py-0.5 font-medium border", STATUS_COLORS[commitment.status])}
          >
            {STATUS_LABELS[commitment.status]}
          </Badge>
        </div>

        {/* المدفوع */}
        <div className={cn(HEADERS[6].width, "shrink-0 text-green-600 font-medium text-xs")}>
          {formatAmount(commitment.paidAmount)}
        </div>

        {/* طريقة الدفع */}
        <div className={cn(HEADERS[7].width, "shrink-0 text-muted-foreground text-xs")}>—</div>

        {/* تاريخ السداد */}
        <div className={cn(HEADERS[8].width, "shrink-0 text-muted-foreground text-xs")}>—</div>

        {/* الرصيد */}
        <div
          className={cn(
            HEADERS[9].width,
            "shrink-0 font-bold text-xs",
            amountDue > 0 ? "text-red-500" : "text-green-600"
          )}
        >
          {formatAmount(amountDue)}
        </div>

        {/* الإجراءات */}
        <div className={cn(HEADERS[10].width, "shrink-0 flex items-center gap-1 justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onView?.(commitment)}
            title="عرض"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onEdit?.(commitment)}
                title="تعديل"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف هذا الالتزام نهائياً. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete?.(commitment._id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {commitment.status !== "paid" && commitment.status !== "cancelled" && (
            <Button
              onClick={() => onRecordPayment(commitment._id)}
              size="sm"
              className="h-7 px-2.5 text-xs font-medium"
            >
              دفع
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderGridCard = (commitment: Commitment) => {
    const daysUntil = getDaysUntil(commitment.dueDate);
    const dueDateStyle = getDueDateStyle(daysUntil);
    const overdue = isOverdue(commitment);
    const amountDue = commitment.amount - commitment.paidAmount;
    const paidPercent = commitment.amount > 0 ? Math.min(100, (commitment.paidAmount / commitment.amount) * 100) : 0;

    return (
      <Card
        key={commitment._id}
        className={cn(
          "flex flex-col h-full transition-shadow hover:shadow-md",
          overdue && "border-red-300 dark:border-red-800"
        )}
      >
        <CardContent className="p-5 flex-1 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dueDateStyle.dot)} />
              <span className={cn("font-bold text-sm truncate", overdue ? "text-red-600" : "text-primary")}>
                {commitment.commitmentNumber}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-2 py-0.5 shrink-0 border", STATUS_COLORS[commitment.status])}
            >
              {STATUS_LABELS[commitment.status]}
            </Badge>
          </div>

          {/* Account & Company */}
          <div>
            <p className="font-semibold text-sm">{commitment.account}</p>
            {showCompanyName && commitment.companyName && (
              <p className="text-xs text-muted-foreground mt-0.5">{commitment.companyName}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{commitment.description}</p>
          </div>

          {/* Due Date */}
          <div className={cn("flex items-center gap-1.5 text-xs", dueDateStyle.text)}>
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(commitment.dueDate)}</span>
            {overdue && <span className="text-red-500 font-bold">(متأخر)</span>}
          </div>

          {/* Amounts */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="font-bold">{formatAmount(commitment.amount)} د.أ</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">مدفوع: {formatAmount(commitment.paidAmount)}</span>
              <span className={cn("font-semibold", amountDue > 0 ? "text-red-500" : "text-green-600")}>
                متبقي: {formatAmount(amountDue)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t mt-auto">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onView?.(commitment)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit?.(commitment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف هذا الالتزام نهائياً. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete?.(commitment._id)}
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
            {commitment.status !== "paid" && commitment.status !== "cancelled" && (
              <Button onClick={() => onRecordPayment(commitment._id)} size="sm" className="h-8 px-3 text-xs">
                تسجيل دفعة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
          className="border rounded-lg p-0.5 bg-muted/30"
        >
          <ToggleGroupItem value="list" aria-label="List View" className="h-8 w-8 rounded-md">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid View" className="h-8 w-8 rounded-md">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Overdue Section */}
      {overdueCommitments.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 border-b border-red-200 dark:border-red-900">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
              التزامات متأخرة ({overdueCommitments.length})
            </h2>
          </div>

          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="flex flex-row items-center bg-red-50/80 dark:bg-red-950/20 px-4 py-2.5 border-b border-red-100 dark:border-red-900/50 min-w-max" dir="rtl">
                {HEADERS.map((h, i) => (
                  <div key={i} className={cn(h.width, "shrink-0 text-xs font-bold text-red-700 dark:text-red-400")}>
                    {h.label}
                  </div>
                ))}
              </div>
              <div className="min-w-max">
                {overdueCommitments.map((c, i) => renderListRow(c, i))}
              </div>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {overdueCommitments.map(renderGridCard)}
            </div>
          )}
        </div>
      )}

      {/* Regular Commitments Section */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        {overdueCommitments.length > 0 && (
          <div className="flex items-center gap-2 bg-muted/40 px-4 py-2.5 border-b">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-sm font-bold text-foreground">الالتزامات القادمة</h2>
          </div>
        )}

        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="flex flex-row items-center bg-muted/50 px-4 py-2.5 border-b min-w-max" dir="rtl">
              {HEADERS.map((h, i) => (
                <div key={i} className={cn(h.width, "shrink-0 text-xs font-bold text-muted-foreground uppercase tracking-wide")}>
                  {h.label}
                </div>
              ))}
            </div>
            <div className="min-w-max">
              {regularCommitments.map((c, i) => renderListRow(c, i))}
              {commitments?.length === 0 && (
                <div className="text-center py-16 px-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-muted-foreground font-medium">لا توجد التزامات</p>
                  <p className="text-muted-foreground text-sm mt-1">ابدأ بإضافة التزام جديد</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularCommitments.map(renderGridCard)}
            {commitments?.length === 0 && (
              <div className="text-center py-16 col-span-2">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-muted-foreground font-medium">لا توجد التزامات</p>
                <p className="text-muted-foreground text-sm mt-1">ابدأ بإضافة التزام جديد</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
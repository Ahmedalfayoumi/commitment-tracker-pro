import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Eye, Edit, Trash2, LayoutGrid, List } from "lucide-react";
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

interface Commitment {
  _id: Id<"commitments">;
  commitmentNumber: string;
  status: keyof typeof STATUS_COLORS;
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

// Column definitions for consistent alignment
const COL_CLASSES = [
  "w-[110px] shrink-0",   // رقم الالتزام
  "w-[90px] shrink-0",    // تاريخ الاستحقاق
  "w-[110px] shrink-0",   // الحساب
  "w-[160px] shrink-0",   // البيان
  "w-[90px] shrink-0",    // القيمة
  "w-[90px] shrink-0",    // الحالة
  "w-[100px] shrink-0",   // المبلغ المدفوع
  "w-[90px] shrink-0",    // طريقة الدفع
  "w-[90px] shrink-0",    // تاريخ السداد
  "w-[90px] shrink-0",    // الرصيد
  "w-[120px] shrink-0",   // الإجراءات
];

const HEADERS = [
  "رقم الالتزام",
  "تاريخ الاستحقاق",
  "الحساب",
  "البيان",
  "القيمة",
  "الحالة",
  "المبلغ المدفوع",
  "طريقة الدفع",
  "تاريخ السداد",
  "الرصيد",
  "",
];

export function CommitmentList({ 
  commitments, 
  onRecordPayment, 
  onEdit, 
  onDelete, 
  onView, 
  isAdmin,
  showCompanyName = false
}: CommitmentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("commitmentViewMode");
    return (saved as "grid" | "list") || "list";
  });

  useEffect(() => {
    localStorage.setItem("commitmentViewMode", viewMode);
  }, [viewMode]);

  const getIndicatorColor = (days: number) => {
    if (days === 0) return "bg-red-500";
    if (days === 1) return "bg-yellow-500";
    if (days === 2) return "bg-orange-500";
    if (days === 3) return "bg-green-500";
    return null;
  };

  const isOverdue = (commitment: Commitment) => {
    const days = getDaysUntil(commitment.dueDate);
    const amountDue = commitment.amount - commitment.paidAmount;
    return days < 0 && amountDue > 0;
  };

  const overdueCommitments = commitments?.filter(isOverdue) || [];
  const regularCommitments = commitments?.filter(c => !isOverdue(c)) || [];

  const renderListRow = (commitment: Commitment) => {
    const daysUntil = getDaysUntil(commitment.dueDate);
    const indicatorColor = getIndicatorColor(daysUntil);
    const overdue = isOverdue(commitment);
    const amountDue = commitment.amount - commitment.paidAmount;

    return (
      <div
        key={commitment._id}
        className={cn(
          "flex flex-row items-center border-b last:border-b-0 py-2 px-3 hover:bg-muted/30 transition-colors text-xs",
          overdue && "bg-red-50/50 dark:bg-red-950/10"
        )}
        dir="rtl"
      >
        {/* رقم الالتزام */}
        <div className={cn(COL_CLASSES[0], "flex items-center gap-1.5")}>
          {indicatorColor && <div className={cn("w-2 h-2 rounded-full shrink-0", indicatorColor)} />}
          <span className={cn("font-bold truncate", overdue && "text-red-600")}>{commitment.commitmentNumber}</span>
        </div>
        {/* تاريخ الاستحقاق */}
        <div className={cn(COL_CLASSES[1], overdue ? "text-red-600 font-bold" : "")}>
          {formatDate(commitment.dueDate)}
        </div>
        {/* الحساب */}
        <div className={cn(COL_CLASSES[2], "truncate font-medium")}>{commitment.account}</div>
        {/* البيان */}
        <div className={cn(COL_CLASSES[3], "truncate text-muted-foreground")}>{commitment.description}</div>
        {/* القيمة */}
        <div className={cn(COL_CLASSES[4], "font-bold text-primary")}>{formatAmount(commitment.amount)}</div>
        {/* الحالة */}
        <div className={COL_CLASSES[5]}>
          <Badge className={`${STATUS_COLORS[commitment.status]} text-[10px] px-1.5 py-0`}>
            {STATUS_LABELS[commitment.status]}
          </Badge>
        </div>
        {/* المبلغ المدفوع */}
        <div className={cn(COL_CLASSES[6], "text-green-600")}>{formatAmount(commitment.paidAmount)}</div>
        {/* طريقة الدفع */}
        <div className={cn(COL_CLASSES[7], "text-muted-foreground")}>-</div>
        {/* تاريخ السداد */}
        <div className={cn(COL_CLASSES[8], "text-muted-foreground")}>-</div>
        {/* الرصيد */}
        <div className={cn(COL_CLASSES[9], "font-bold", overdue ? "text-red-600" : "text-red-500")}>
          {formatAmount(amountDue)}
        </div>
        {/* الإجراءات */}
        <div className={cn(COL_CLASSES[10], "flex items-center gap-0.5 justify-end")}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(commitment)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(commitment)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
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
              className="h-7 px-2 text-xs"
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
    const indicatorColor = getIndicatorColor(daysUntil);
    const overdue = isOverdue(commitment);
    const amountDue = commitment.amount - commitment.paidAmount;

    return (
      <Card
        key={commitment._id}
        className={cn(
          "flex flex-col h-full",
          overdue && "border-red-500 bg-red-50/50 dark:bg-red-950/10"
        )}
      >
        <CardContent className="p-6 flex-1">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {indicatorColor && <div className={cn("w-3 h-3 rounded-full", indicatorColor)} />}
                  <h3 className={cn("text-lg font-semibold", overdue && "text-red-600")}>{commitment.commitmentNumber}</h3>
                  <Badge className={STATUS_COLORS[commitment.status]}>
                    {STATUS_LABELS[commitment.status]}
                  </Badge>
                  {showCompanyName && (
                    <Badge variant="outline" className="text-xs">
                      {commitment.companyName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{commitment.account}</p>
                <p className="text-sm mb-4 line-clamp-2">{commitment.description}</p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className={cn("flex items-center gap-2", overdue && "text-red-600 font-bold")}>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(commitment.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>المبلغ: {formatAmount(commitment.amount)} د.أ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">المدفوع: {formatAmount(commitment.paidAmount)} د.أ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(overdue ? "text-red-600 font-bold" : "text-red-600")}>
                      المتبقي: {formatAmount(amountDue)} د.أ
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-between items-center mt-4 pt-4 border-t">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onView?.(commitment)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(commitment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
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
                <Button
                  onClick={() => onRecordPayment(commitment._id)}
                  size="sm"
                >
                  تسجيل دفعة
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
          <ToggleGroupItem value="list" aria-label="List View">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid View">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Table Header - only in list mode */}
      {viewMode === "list" && (
        <div
          className="flex flex-row items-center text-xs font-bold bg-muted/60 border rounded-t-lg px-3 py-2"
          dir="rtl"
        >
          {HEADERS.map((header, i) => (
            <div key={i} className={COL_CLASSES[i]}>
              {header}
            </div>
          ))}
        </div>
      )}

      {overdueCommitments.length > 0 && (
        <div className="space-y-0">
          <div className="flex items-center gap-2 text-red-600 font-bold px-1 py-2">
            <div className="w-2 h-6 bg-red-600 rounded-full" />
            <h2>التزامات متأخرة ({overdueCommitments.length})</h2>
          </div>
          {viewMode === "list" ? (
            <div className="border rounded-b-lg overflow-x-auto">
              <div className="min-w-max divide-y">
                {overdueCommitments.map(renderListRow)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overdueCommitments.map(renderGridCard)}
            </div>
          )}
        </div>
      )}

      <div className="space-y-0">
        {overdueCommitments.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground font-bold px-1 py-2 pt-4">
            <div className="w-2 h-6 bg-muted rounded-full" />
            <h2>الالتزامات القادمة</h2>
          </div>
        )}
        {viewMode === "list" ? (
          <div className={cn("border overflow-x-auto", overdueCommitments.length === 0 ? "rounded-lg" : "rounded-b-lg")}>
            <div className="min-w-max divide-y">
              {regularCommitments.map(renderListRow)}
              {commitments?.length === 0 && (
                <div className="text-center py-12 bg-muted/30 px-8">
                  <p className="text-muted-foreground">لا توجد التزامات</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularCommitments.map(renderGridCard)}
            {commitments?.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed col-span-2">
                <p className="text-muted-foreground">لا توجد التزامات</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
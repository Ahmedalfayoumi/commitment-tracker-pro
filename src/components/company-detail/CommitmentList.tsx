import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Eye, Edit, Trash2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { formatAmount, formatDate } from "@/lib/utils";
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
}

interface CommitmentListProps {
  commitments: Commitment[] | undefined;
  onRecordPayment: (id: Id<"commitments">) => void;
  onEdit?: (commitment: any) => void;
  onDelete?: (id: Id<"commitments">) => void;
  onView?: (commitment: any) => void;
  isAdmin?: boolean;
}

export function CommitmentList({ commitments, onRecordPayment, onEdit, onDelete, onView, isAdmin }: CommitmentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("commitmentViewMode");
    return (saved as "grid" | "list") || "list";
  });

  useEffect(() => {
    localStorage.setItem("commitmentViewMode", viewMode);
  }, [viewMode]);

  return (
    <div className="space-y-4">
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

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
        {commitments?.map((commitment) => (
          <Card key={commitment._id} className={viewMode === "list" ? "" : "flex flex-col h-full"}>
            <CardContent className="p-6 flex-1">
              <div className={`flex ${viewMode === "list" ? "items-start justify-between" : "flex-col gap-4"}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{commitment.commitmentNumber}</h3>
                    <Badge className={STATUS_COLORS[commitment.status]}>
                      {STATUS_LABELS[commitment.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{commitment.account}</p>
                  <p className="text-sm mb-4 line-clamp-2">{commitment.description}</p>
                  <div className={`flex ${viewMode === "list" ? "items-center gap-6" : "flex-col gap-2"} text-sm`}>
                    <div className="flex items-center gap-2">
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
                      <span className="text-red-600">المتبقي: {formatAmount(commitment.amount - commitment.paidAmount)} د.أ</span>
                    </div>
                  </div>
                </div>
                <div className={`flex ${viewMode === "list" ? "flex-col items-end gap-2" : "flex-row justify-between items-center mt-4 pt-4 border-t"}`}>
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
        ))}
      </div>
    </div>
  );
}
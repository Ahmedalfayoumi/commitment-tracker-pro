import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";

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
}

export function CommitmentList({ commitments, onRecordPayment }: CommitmentListProps) {
  return (
    <div className="space-y-4">
      {commitments?.map((commitment) => (
        <Card key={commitment._id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{commitment.commitmentNumber}</h3>
                  <Badge className={STATUS_COLORS[commitment.status]}>
                    {STATUS_LABELS[commitment.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{commitment.account}</p>
                <p className="text-sm mb-4">{commitment.description}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(commitment.dueDate).toLocaleDateString("ar-JO")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>المبلغ: {commitment.amount.toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">المدفوع: {commitment.paidAmount.toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">المتبقي: {(commitment.amount - commitment.paidAmount).toFixed(2)} د.أ</span>
                  </div>
                </div>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

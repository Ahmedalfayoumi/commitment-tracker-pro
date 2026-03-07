import { Navigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { BarChart2, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" />;

  return (
    <div className="p-6 lg:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-primary" />
            التقارير
          </h1>
          <p className="text-muted-foreground mt-1">تقارير مالية وتحليلات شاملة</p>
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">قيد التطوير</h2>
              <p className="text-muted-foreground mt-2 max-w-sm">
                صفحة التقارير قيد التطوير حالياً. ستتوفر قريباً تقارير مالية تفصيلية وتحليلات شاملة.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

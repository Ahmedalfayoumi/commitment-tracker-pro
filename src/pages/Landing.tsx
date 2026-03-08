import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  Building2, 
  ArrowRight,
  Wallet,
  CalendarDays,
  FileText
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Commitment Tracker Pro</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            تسجيل الدخول
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,var(--color-primary)_0%,transparent_100%)] opacity-5" />
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                أدر التزاماتك المالية <span className="text-primary">بذكاء واحترافية</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                نظام متكامل لإدارة الشركات والالتزامات المالية الشهرية. تتبع المدفوعات، راقب التدفقات النقدية، ونظم حساباتك في مكان واحد.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-10 h-14 font-bold">
                  تسجيل الدخول
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-8">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>إدارة شركات متعددة</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>تتبع دقيق للمدفوعات</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>تقارير مالية فورية</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">كل ما تحتاجه لإدارة مالية ناجحة</h2>
            <p className="text-muted-foreground">أدوات قوية مصممة لتبسيط العمليات المالية المعقدة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "إدارة شركات متعددة",
                desc: "أضف وأدر عدة شركات من لوحة تحكم واحدة مع تخصيص كامل لكل شركة.",
                icon: Building2,
              },
              {
                title: "تتبع الالتزامات",
                desc: "نظام ترقيم تلقائي وفلترة شهرية ذكية لمتابعة كافة الالتزامات المالية.",
                icon: CalendarDays,
              },
              {
                title: "نظام مدفوعات متطور",
                desc: "سجل المدفوعات وحدث حالة الالتزامات تلقائياً (مدفوع، مدفوع جزئياً، مؤجل).",
                icon: Wallet,
              },
              {
                title: "تقارير وتحليلات",
                desc: "نظرة شاملة على الوضع المالي من خلال بطاقات ملخصة ورسوم بيانية.",
                icon: BarChart3,
              },
              {
                title: "أمان وموثوقية",
                desc: "بياناتك محمية بأعلى معايير التشفير مع نظام صلاحيات دقيق للمستخدمين.",
                icon: ShieldCheck,
              },
              {
                title: "أرشفة المستندات",
                desc: "ارفع شعارات الشركات وفواتير الالتزامات للرجوع إليها في أي وقت.",
                icon: FileText,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-lg transition-shadow border-none bg-background">
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-12 text-primary-foreground flex flex-col md:flex-row items-center justify-around gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">متعددة</div>
              <div className="opacity-80">شركات مدارة في مكان واحد</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20 hidden md:block" />
            <div>
              <div className="text-4xl font-bold mb-2">فوري</div>
              <div className="opacity-80">تتبع المدفوعات والالتزامات</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20 hidden md:block" />
            <div>
              <div className="text-4xl font-bold mb-2">آمن</div>
              <div className="opacity-80">نظام صلاحيات دقيق لكل مستخدم</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Commitment Tracker Pro</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">الشروط والأحكام</a>
              <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-primary transition-colors">اتصل بنا</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
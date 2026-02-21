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
import { toast } from "sonner";

export default function Landing() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();

  const handleStartNow = async () => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    try {
      await signIn("anonymous");
      navigate("/dashboard");
    } catch (error) {
      console.error("Guest access error:", error);
      toast.error("حدث خطأ أثناء محاولة الدخول");
    }
  };

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
          <div className="flex items-center gap-4">
            <Button onClick={handleStartNow}>ابدأ الآن</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,var(--color-primary)_0%,transparent_100%)] opacity-5" />
        <div className="container mx-auto text-center max-w-4xl">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-lg gap-2" onClick={handleStartNow}>
                ابدأ تجربتك المجانية <ArrowRight className="h-5 w-5 rotate-180" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                شاهد العرض التجريبي
              </Button>
            </div>
          </motion.div>
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
              <div className="text-4xl font-bold mb-2">+500</div>
              <div className="opacity-80">شركة مسجلة</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20 hidden md:block" />
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="opacity-80">وقت التشغيل</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20 hidden md:block" />
            <div>
              <div className="text-4xl font-bold mb-2">+1M</div>
              <div className="opacity-80">التزام مالي مدار</div>
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
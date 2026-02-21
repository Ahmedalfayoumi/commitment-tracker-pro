import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Home, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isLoginDisabled = false;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/dashboard";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoginDisabled) return;
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.append("flow", "signIn");
      await signIn("password", formData);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ ما");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="Logo" className="h-12 w-12 cursor-pointer" onClick={() => navigate("/")} />
          </div>
          <CardTitle className="text-2xl font-bold">التزامات برو</CardTitle>
          <CardDescription>إدارة التزاماتك المالية بكل سهولة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoginDisabled && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>تنبيه</AlertTitle>
              <AlertDescription>
                تسجيل الدخول معطل حالياً حتى إشعار آخر.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-2 text-center">
            <p className="text-xs text-muted-foreground mb-1">بيانات مدير النظام:</p>
            <p className="text-sm font-mono font-bold text-primary">admin / admin</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المستخدم</label>
              <Input name="username" required placeholder="أدخل اسم المستخدم" disabled={isLoading || isLoginDisabled} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <Input name="password" type="password" required placeholder="••••••••" disabled={isLoading || isLoginDisabled} />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading || isLoginDisabled}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link to="/" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
          <div className="text-xs text-center text-muted-foreground">
            بواسطة <a href="https://vly.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">vly.ai</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Auth {...props} />;
}
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  LogOut, 
  ChevronLeft,
  Settings,
  User,
  CreditCard
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useQuery(api.users.currentUser);
  const companies = useQuery(api.companies.getUserCompanies);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    {
      title: "لوحة التحكم",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "تسجيل شركة جديدة",
      url: "/register-company",
      icon: PlusCircle,
    },
  ];

  return (
    <Sidebar side="right" collapsible="icon" className="border-l" dir="rtl">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">التزامات برو</span>
            <span className="text-xs text-muted-foreground">إدارة مالية ذكية</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>شركاتي</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {companies?.map((company: any) => (
                <SidebarMenuItem key={company._id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === `/company/${company._id}`}
                  >
                    <Link to={`/company/${company._id}`} className="flex items-center gap-3">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="" className="h-5 w-5 rounded object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                      <span className="truncate">{company.nameAr}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {companies?.length === 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground italic">
                  لا توجد شركات مسجلة
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-2">
          <ChangePasswordDialog />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
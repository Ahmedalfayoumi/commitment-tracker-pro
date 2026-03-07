import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

const NOTIF_COLORS = {
  due_today: "bg-red-100 border-red-300 text-red-800",
  due_1day: "bg-orange-100 border-orange-300 text-orange-800",
  due_2days: "bg-yellow-100 border-yellow-300 text-yellow-800",
  due_3days: "bg-green-100 border-green-300 text-green-800",
};

const NOTIF_DOT_COLORS = {
  due_today: "bg-red-500",
  due_1day: "bg-orange-500",
  due_2days: "bg-yellow-500",
  due_3days: "bg-green-500",
};

const NOTIF_LABELS = {
  due_today: "اليوم",
  due_1day: "غداً",
  due_2days: "بعد يومين",
  due_3days: "بعد 3 أيام",
};

export function NotificationBell() {
  const notifications = useQuery(api.notifications.getUserNotifications);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notificationActions.markAsRead);
  const markAllAsRead = useMutation(api.notificationActions.markAllAsRead);
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleMarkRead = async (id: Id<"notifications">) => {
    await markAsRead({ notificationId: id });
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead({});
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-lg"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">الإشعارات</h3>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40",
                    !notif.isRead && "bg-muted/20"
                  )}
                  onClick={() => handleMarkRead(notif._id)}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "mt-1 w-2 h-2 rounded-full shrink-0",
                        NOTIF_DOT_COLORS[notif.type]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                            NOTIF_COLORS[notif.type]
                          )}
                        >
                          {NOTIF_LABELS[notif.type]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(notif.dueDate)}
                        </span>
                        {notif.companyName && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {notif.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

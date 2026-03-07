import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Shield, User, ChevronDown, ChevronUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/convex/permissions";

interface PermissionsSectionProps {
  companyId: Id<"companies">;
  isAdmin: boolean;
}

function PermissionCheckboxGroup({
  permissions,
  selected,
  onChange,
  disabled = false,
}: {
  permissions: typeof PERMISSION_GROUPS;
  selected: string[];
  onChange: (perms: string[]) => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (perm: string) => {
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  };

  const toggleGroup = (group: string, groupPerms: string[]) => {
    const allSelected = groupPerms.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !groupPerms.includes(p)));
    } else {
      const newSet = new Set([...selected, ...groupPerms]);
      onChange(Array.from(newSet));
    }
  };

  return (
    <div className="space-y-3">
      {Object.entries(permissions).map(([group, perms]) => {
        const allSelected = perms.every((p) => selected.includes(p));
        const someSelected = perms.some((p) => selected.includes(p));
        const isExpanded = expanded[group] !== false;

        return (
          <div key={group} className="border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
              onClick={() => setExpanded((e) => ({ ...e, [group]: !isExpanded }))}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => !disabled && toggleGroup(group, perms)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={disabled}
                  className={someSelected && !allSelected ? "opacity-60" : ""}
                />
                <span className="font-medium text-sm">{group}</span>
                {someSelected && (
                  <Badge variant="secondary" className="text-xs">
                    {perms.filter((p) => selected.includes(p)).length}/{perms.length}
                  </Badge>
                )}
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            {isExpanded && (
              <div className="p-3 grid grid-cols-2 gap-2">
                {perms.map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <Checkbox
                      id={perm}
                      checked={selected.includes(perm)}
                      onCheckedChange={() => !disabled && toggle(perm)}
                      disabled={disabled}
                    />
                    <Label htmlFor={perm} className="text-sm cursor-pointer">
                      {PERMISSION_LABELS[perm] || perm}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PositionDialog({
  isOpen,
  onOpenChange,
  companyId,
  position,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
  position?: any;
}) {
  const createPosition = useMutation(api.permissions.createPosition);
  const updatePosition = useMutation(api.permissions.updatePosition);
  const [name, setName] = useState(position?.name || "");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(position?.permissions || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("يرجى إدخال اسم المنصب"); return; }
    setIsLoading(true);
    try {
      if (position) {
        await updatePosition({ positionId: position._id, name, permissions: selectedPerms });
        toast.success("تم تحديث المنصب بنجاح");
      } else {
        await createPosition({ companyId, name, permissions: selectedPerms });
        toast.success("تم إنشاء المنصب بنجاح");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{position ? "تعديل المنصب" : "إنشاء منصب جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المنصب *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محاسب، مدير مالي..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>الصلاحيات</Label>
            <PermissionCheckboxGroup
              permissions={PERMISSION_GROUPS}
              selected={selectedPerms}
              onChange={setSelectedPerms}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserPermissionsDialog({
  isOpen,
  onOpenChange,
  companyId,
  userPosition,
  positions,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: Id<"companies">;
  userPosition: any;
  positions: any[];
}) {
  const setUserPosition = useMutation(api.permissions.setUserPosition);
  const [selectedPositionId, setSelectedPositionId] = useState<string>(userPosition?.positionId || "none");
  const [grantedPerms, setGrantedPerms] = useState<string[]>(userPosition?.grantedPermissions || []);
  const [revokedPerms, setRevokedPerms] = useState<string[]>(userPosition?.revokedPermissions || []);
  const [isLoading, setIsLoading] = useState(false);

  const selectedPosition = positions.find((p) => p._id === selectedPositionId);
  const positionPerms: string[] = selectedPosition?.permissions || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await setUserPosition({
        companyId,
        userId: userPosition.userId,
        positionId: selectedPositionId !== "none" ? (selectedPositionId as Id<"positions">) : undefined,
        grantedPermissions: grantedPerms,
        revokedPermissions: revokedPerms,
      });
      toast.success("تم تحديث صلاحيات المستخدم بنجاح");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  // Compute effective permissions for preview
  const effectiveSet = new Set([...positionPerms, ...grantedPerms]);
  for (const r of revokedPerms) effectiveSet.delete(r);
  const effectivePerms = Array.from(effectiveSet);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>صلاحيات المستخدم: {userPosition?.userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>المنصب</Label>
            <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر منصباً..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون منصب</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPosition && (
              <div className="flex flex-wrap gap-1 mt-1">
                {positionPerms.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">{PERMISSION_LABELS[p] || p}</Badge>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="granted">
            <TabsList className="w-full">
              <TabsTrigger value="granted" className="flex-1">
                صلاحيات إضافية ({grantedPerms.length})
              </TabsTrigger>
              <TabsTrigger value="revoked" className="flex-1">
                صلاحيات مسحوبة ({revokedPerms.length})
              </TabsTrigger>
              <TabsTrigger value="effective" className="flex-1">
                الصلاحيات الفعلية ({effectivePerms.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="granted" className="mt-3">
              <p className="text-sm text-muted-foreground mb-3">صلاحيات إضافية تُمنح لهذا المستخدم بغض النظر عن منصبه</p>
              <PermissionCheckboxGroup
                permissions={PERMISSION_GROUPS}
                selected={grantedPerms}
                onChange={setGrantedPerms}
              />
            </TabsContent>
            <TabsContent value="revoked" className="mt-3">
              <p className="text-sm text-muted-foreground mb-3">صلاحيات تُسحب من هذا المستخدم حتى لو كانت ضمن منصبه</p>
              <PermissionCheckboxGroup
                permissions={PERMISSION_GROUPS}
                selected={revokedPerms}
                onChange={setRevokedPerms}
              />
            </TabsContent>
            <TabsContent value="effective" className="mt-3">
              <p className="text-sm text-muted-foreground mb-3">الصلاحيات الفعلية للمستخدم (المنصب + الإضافية - المسحوبة)</p>
              <div className="flex flex-wrap gap-2">
                {effectivePerms.length === 0 ? (
                  <p className="text-muted-foreground text-sm">لا توجد صلاحيات</p>
                ) : (
                  effectivePerms.map((p) => (
                    <Badge key={p} className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      {PERMISSION_LABELS[p] || p}
                    </Badge>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ الصلاحيات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PermissionsSection({ companyId, isAdmin }: PermissionsSectionProps) {
  const positions = useQuery(api.permissions.getPositions, { companyId });
  const userPositions = useQuery(api.permissions.getUserPositions, { companyId });
  const deletePosition = useMutation(api.permissions.deletePosition);

  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [editingUserPosition, setEditingUserPosition] = useState<any>(null);
  const [isUserPermDialogOpen, setIsUserPermDialogOpen] = useState(false);

  const handleDeletePosition = async (positionId: Id<"positions">) => {
    try {
      await deletePosition({ positionId });
      toast.success("تم حذف المنصب بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حذف المنصب");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Positions Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              المناصب والصلاحيات
            </CardTitle>
            <CardDescription>إنشاء مناصب وتحديد صلاحياتها</CardDescription>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => { setEditingPosition(null); setIsPositionDialogOpen(true); }}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              منصب جديد
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {positions && positions.length > 0 ? (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position._id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{position.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {position.permissions.length} صلاحية
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {position.permissions.slice(0, 6).map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {PERMISSION_LABELS[p] || p}
                        </Badge>
                      ))}
                      {position.permissions.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{position.permissions.length - 6} أخرى
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 mr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingPosition(position); setIsPositionDialogOpen(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المنصب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف منصب "{position.name}"؟ سيتم إزالته من جميع المستخدمين المرتبطين به.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePosition(position._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد مناصب محددة بعد</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => { setEditingPosition(null); setIsPositionDialogOpen(true); }}
                >
                  إنشاء أول منصب
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            صلاحيات المستخدمين
          </CardTitle>
          <CardDescription>ربط المستخدمين بالمناصب وإضافة استثناءات فردية</CardDescription>
        </CardHeader>
        <CardContent>
          {userPositions && userPositions.length > 0 ? (
            <div className="space-y-3">
              {userPositions.map((up) => (
                <div
                  key={up.userId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{up.userName}</span>
                      <span className="text-xs text-muted-foreground">@{up.username}</span>
                      <Badge
                        variant={up.companyRole === "admin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {up.companyRole === "admin" ? "مسؤول" : "مستخدم"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {up.positionName ? (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 ml-1" />
                          {up.positionName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">بدون منصب</span>
                      )}
                      {up.grantedPermissions.length > 0 && (
                        <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          +{up.grantedPermissions.length} إضافية
                        </Badge>
                      )}
                      {up.revokedPermissions.length > 0 && (
                        <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          -{up.revokedPermissions.length} مسحوبة
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {up.effectivePermissions.length} صلاحية فعلية
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUserPosition(up);
                        setIsUserPermDialogOpen(true);
                      }}
                      className="gap-1 mr-2"
                    >
                      <Edit className="h-3 w-3" />
                      تعديل
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد مستخدمون في هذه الشركة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PositionDialog
        isOpen={isPositionDialogOpen || !!editingPosition}
        onOpenChange={(open) => {
          if (!open) { setIsPositionDialogOpen(false); setEditingPosition(null); }
        }}
        companyId={companyId}
        position={editingPosition}
      />

      {editingUserPosition && (
        <UserPermissionsDialog
          isOpen={isUserPermDialogOpen}
          onOpenChange={(open) => {
            if (!open) { setIsUserPermDialogOpen(false); setEditingUserPosition(null); }
          }}
          companyId={companyId}
          userPosition={editingUserPosition}
          positions={positions || []}
        />
      )}
    </div>
  );
}

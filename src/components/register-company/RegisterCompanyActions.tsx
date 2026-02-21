import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegisterCompanyActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

export function RegisterCompanyActions({ isSubmitting, onCancel }: RegisterCompanyActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        إلغاء
      </Button>
      <Button type="submit" disabled={isSubmitting} className="gap-2">
        {isSubmitting ? (
          <>جاري الحفظ...</>
        ) : (
          <>
            <Save className="h-5 w-5" />
            حفظ الشركة
          </>
        )}
      </Button>
    </div>
  );
}

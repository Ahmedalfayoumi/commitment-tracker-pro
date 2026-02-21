import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LogoSectionProps {
  setLogoFile: (file: File | null) => void;
  setFaviconFile: (file: File | null) => void;
}

export function LogoSection({ setLogoFile, setFaviconFile }: LogoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>شعار الشركة والأيقونة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="logo">شعار الشركة</Label>
            <div className="flex items-center gap-2">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="favicon">أيقونة الموقع (Favicon)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="favicon"
                type="file"
                accept="image/*"
                onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

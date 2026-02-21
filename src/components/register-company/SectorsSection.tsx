import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Sector = { value: string; label: string };

interface SectorsSectionProps {
  sectors: Array<Sector>;
  selectedSectors: Array<string>;
  onToggle: (sector: string) => void;
}

export function SectorsSection({ sectors, selectedSectors, onToggle }: SectorsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>قطاعات الشركة</CardTitle>
        <CardDescription>اختر القطاعات التي تعمل بها الشركة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sectors.map((sector) => (
            <div key={sector.value} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={sector.value}
                checked={selectedSectors.includes(sector.value)}
                onCheckedChange={() => onToggle(sector.value)}
              />
              <Label htmlFor={sector.value} className="cursor-pointer">
                {sector.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

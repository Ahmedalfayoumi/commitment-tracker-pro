import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CommitmentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMonth: string | undefined;
  setSelectedMonth: (month: string | undefined) => void;
  availableMonths: string[] | undefined;
  onAddClick: () => void;
}

export function CommitmentFilters({
  searchQuery,
  setSearchQuery,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  onAddClick,
}: CommitmentFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الالتزامات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select 
          value={selectedMonth || "all"} 
          onValueChange={(val) => setSelectedMonth(val === "all" ? undefined : val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="تصفية حسب الشهر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأشهر</SelectItem>
            {availableMonths?.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="gap-2" onClick={onAddClick}>
        <Plus className="h-5 w-5" />
        إضافة التزام جديد
      </Button>
    </div>
  );
}

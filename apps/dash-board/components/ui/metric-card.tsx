import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trending: "up" | "down";
  description: string;
  subtext: string;
  icon: LucideIcon;
  color: string;
}

export function MetricCard({
  title,
  value,
  change,
  trending,
  description,
  subtext,
  color,
}: MetricCardProps) {
  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
          <div className={`flex items-center space-x-1 ${color}`}>
            {trending === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{change}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-gray-400">{description}</p>
          <p className="text-xs text-gray-500">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

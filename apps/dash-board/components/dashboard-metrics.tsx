import { Activity, DollarSign, Target, Users } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

const dashboardCards = [
  {
    title: "Total Revenue",
    value: "$1,250.00",
    change: "+12.5%",
    trending: "up" as const,
    description: "Trending up this month",
    subtext: "Visitors for the last 6 months",
    icon: DollarSign,
    color: "text-green-500",
  },
  {
    title: "New Customers",
    value: "1,234",
    change: "-20%",
    trending: "down" as const,
    description: "Down 20% this period",
    subtext: "Acquisition needs attention",
    icon: Users,
    color: "text-red-500",
  },
  {
    title: "Active Accounts",
    value: "45,678",
    change: "+12.5%",
    trending: "up" as const,
    description: "Strong user retention",
    subtext: "Engagement exceed targets",
    icon: Activity,
    color: "text-green-500",
  },
  {
    title: "Growth Rate",
    value: "4.5%",
    change: "+4.5%",
    trending: "up" as const,
    description: "Steady performance increase",
    subtext: "Meets growth projections",
    icon: Target,
    color: "text-green-500",
  },
];

export function DashboardMetrics() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {dashboardCards.map((card, index) => (
        <MetricCard
          key={index}
          title={card.title}
          value={card.value}
          change={card.change}
          trending={card.trending}
          description={card.description}
          subtext={card.subtext}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "default" | "success" | "danger" | "warning";
}

const colors = {
  default: "text-[#1a3a5c]",
  success: "text-emerald-500",
  danger: "text-red-500",
  warning: "text-amber-500",
};

export default function StatCard({ label, value, subtitle, color = "default" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${colors[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

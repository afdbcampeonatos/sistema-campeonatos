interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const KPICard = ({ title, value, icon }: KPICardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="text-blue-900 text-3xl">{icon}</div>
        )}
      </div>
    </div>
  );
};


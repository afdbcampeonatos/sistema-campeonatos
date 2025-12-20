interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

export const InfoCard = ({ title, children }: InfoCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
};


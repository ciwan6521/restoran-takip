interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = 'bg-gray-500/20';
  let textColor = 'text-gray-100';
  let borderColor = 'border-gray-500/30';

  switch (status) {
    case 'Online':
      bgColor = 'bg-green-500/20';
      textColor = 'text-green-100';
      borderColor = 'border-green-500/30';
      break;
    case 'Offline':
      bgColor = 'bg-red-500/20';
      textColor = 'text-red-100';
      borderColor = 'border-red-500/30';
      break;
    case 'Auth Error':
      bgColor = 'bg-orange-500/20';
      textColor = 'text-orange-100';
      borderColor = 'border-orange-500/30';
      break;
    case 'API Error':
    case 'Rate Limited':
      bgColor = 'bg-yellow-500/20';
      textColor = 'text-yellow-100';
      borderColor = 'border-yellow-500/30';
      break;
    default:
      bgColor = 'bg-gray-500/20';
      textColor = 'text-gray-100';
      borderColor = 'border-gray-500/30';
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${bgColor} ${textColor} ${borderColor}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

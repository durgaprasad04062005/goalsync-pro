import { STATUS_COLORS } from '../../utils/constants';

const Badge = ({ status, label, size = 'sm' }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const sizeClass = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClass} ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label || status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
};

export default Badge;

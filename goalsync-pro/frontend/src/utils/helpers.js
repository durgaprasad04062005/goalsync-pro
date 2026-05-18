import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date, fmt = 'MMM dd, yyyy') => {
  if (!date) return '—';
  try { return format(new Date(date), fmt); } catch { return '—'; }
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return '—'; }
};

export const calculateProgress = (uom, target, achievement) => {
  if (achievement === null || achievement === undefined || target === 0) return 0;
  const a = parseFloat(achievement);
  const t = parseFloat(target);
  switch (uom) {
    case 'numeric_min':
    case 'percentage':
      return Math.min((a / t) * 100, 150);
    case 'numeric_max':
      if (a === 0) return 0;
      return Math.min((t / a) * 100, 150);
    case 'zero_based':
      return a === 0 ? 100 : 0;
    case 'timeline':
      return Math.min((a / t) * 100, 100);
    default:
      return 0;
  }
};

export const getProgressColor = (progress) => {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 75) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getProgressTextColor = (progress) => {
  if (progress >= 100) return 'text-green-600 dark:text-green-400';
  if (progress >= 75) return 'text-blue-600 dark:text-blue-400';
  if (progress >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getRoleLabel = (role) => {
  const labels = { employee: 'Employee', manager: 'Manager', admin: 'Admin / HR' };
  return labels[role] || role;
};

export const getUomLabel = (uom) => {
  const labels = {
    numeric_min: 'Numeric (Min)',
    numeric_max: 'Numeric (Max)',
    percentage: 'Percentage',
    timeline: 'Timeline',
    zero_based: 'Zero-based',
  };
  return labels[uom] || uom;
};

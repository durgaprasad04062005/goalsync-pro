import { motion } from 'framer-motion';
import { getProgressColor } from '../../utils/helpers';

const ProgressBar = ({ value = 0, showLabel = true, size = 'md', animated = true, className = '' }) => {
  const clampedValue = Math.min(Math.max(value, 0), 150);
  const displayValue = Math.min(clampedValue, 100); // visual bar capped at 100%
  const colorClass = getProgressColor(clampedValue);

  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
          <span className={`text-xs font-semibold ${clampedValue >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {clampedValue.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className={`${heights[size]} rounded-full ${colorClass}`}
          initial={animated ? { width: 0 } : { width: `${displayValue}%` }}
          animate={{ width: `${displayValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

import { motion } from 'framer-motion';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, action, actionLabel, actionIcon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    {Icon && (
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
    )}
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>}
    {action && (
      <div className="mt-5">
        <Button onClick={action} icon={actionIcon}>{actionLabel}</Button>
      </div>
    )}
  </motion.div>
);

export default EmptyState;

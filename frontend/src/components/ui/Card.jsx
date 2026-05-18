import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = false, padding = true, onClick }) => {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? { whileHover: { y: -2, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }, transition: { duration: 0.2 } } : {};

  return (
    <Component
      className={`card ${padding ? 'p-5' : ''} ${hover ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ title, subtitle, action, icon: Icon }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
          <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default Card;

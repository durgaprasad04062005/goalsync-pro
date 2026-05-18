export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const GOAL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  RETURNED: 'returned',
  LOCKED: 'locked',
};

export const UOM_TYPES = [
  { value: 'numeric_min', label: 'Numeric (Min) – Higher is Better', description: 'Progress = Achievement ÷ Target' },
  { value: 'numeric_max', label: 'Numeric (Max) – Lower is Better', description: 'Progress = Target ÷ Achievement' },
  { value: 'percentage', label: 'Percentage', description: 'Progress = Achievement ÷ Target × 100' },
  { value: 'timeline', label: 'Timeline', description: 'Completion based on deadline vs achieved date' },
  { value: 'zero_based', label: 'Zero-based', description: 'If value = 0 → 100%, Else → 0%' },
];

export const QUARTERS = [
  { value: 'Q1', label: 'Q1 (April – June)', month: 'July' },
  { value: 'Q2', label: 'Q2 (July – September)', month: 'October' },
  { value: 'Q3', label: 'Q3 (October – December)', month: 'January' },
  { value: 'Q4', label: 'Q4 (January – March)', month: 'March/April' },
];

export const ACHIEVEMENT_STATUS = [
  { value: 'not_started', label: 'Not Started', color: 'gray' },
  { value: 'on_track', label: 'On Track', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
];

export const THRUST_AREAS = [
  'Technical Excellence',
  'Code Quality',
  'Delivery',
  'Learning & Development',
  'Customer Satisfaction',
  'Revenue',
  'Customer Acquisition',
  'Retention',
  'Process Improvement',
  'Innovation',
  'Team Collaboration',
  'Leadership',
  'Compliance',
  'Cost Optimization',
  'Other',
];

export const STATUS_COLORS = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' },
  submitted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  returned: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  locked: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  not_started: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' },
  on_track: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
};

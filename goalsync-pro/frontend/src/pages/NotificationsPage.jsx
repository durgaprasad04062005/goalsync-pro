import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../store/slices/notificationSlice';
import { formatRelativeTime } from '../utils/helpers';

const TYPE_COLORS = {
  goal_submitted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  goal_approved: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  goal_returned: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  checkin_reminder: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  escalation: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  shared_goal: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  system: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items, loading, unreadCount } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50 }));
  }, [dispatch]);

  const handleMarkRead = (id) => dispatch(markNotificationRead(id));
  const handleMarkAllRead = () => dispatch(markAllNotificationsRead());

  return (
    <Layout title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
      <div className="max-w-2xl mx-auto space-y-4">
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" icon={CheckIcon} onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          </div>
        )}

        <Card padding={false}>
          {loading ? (
            <LoadingSpinner />
          ) : items.length === 0 ? (
            <EmptyState icon={BellIcon} title="No notifications" description="You're all caught up!" />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {items.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                    <BellIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default NotificationsPage;

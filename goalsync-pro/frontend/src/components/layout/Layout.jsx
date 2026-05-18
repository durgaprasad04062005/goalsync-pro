import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchNotifications } from '../../store/slices/notificationSlice';

const Layout = ({ children, title, subtitle }) => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state) => state.ui);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 5 }));
    // Poll for new notifications every 60 seconds
    const interval = setInterval(() => {
      dispatch(fetchNotifications({ limit: 5 }));
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-900">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarOpen ? 240 : 68 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;

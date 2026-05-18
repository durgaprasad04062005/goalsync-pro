import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon, FlagIcon, ChartBarIcon, UsersIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon, BellIcon, DocumentChartBarIcon,
  ClipboardDocumentListIcon, ShieldCheckIcon, UserCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { getInitials } from '../../utils/helpers';

const navItems = {
  employee: [
    { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/goals', icon: FlagIcon, label: 'My Goals' },
    { to: '/achievements', icon: ChartBarIcon, label: 'Achievements' },
    { to: '/notifications', icon: BellIcon, label: 'Notifications' },
    { to: '/profile', icon: UserCircleIcon, label: 'Profile' },
  ],
  manager: [
    { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/goals', icon: FlagIcon, label: 'My Goals' },
    { to: '/achievements', icon: ChartBarIcon, label: 'Achievements' },
    { to: '/team', icon: UsersIcon, label: 'Team' },
    { to: '/reports', icon: DocumentChartBarIcon, label: 'Reports' },
    { to: '/notifications', icon: BellIcon, label: 'Notifications' },
    { to: '/profile', icon: UserCircleIcon, label: 'Profile' },
  ],
  admin: [
    { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/goals', icon: FlagIcon, label: 'Goals' },
    { to: '/team', icon: UsersIcon, label: 'Team' },
    { to: '/admin', icon: ShieldCheckIcon, label: 'Admin Panel' },
    { to: '/admin/users', icon: UsersIcon, label: 'User Management' },
    { to: '/admin/cycles', icon: ClipboardDocumentListIcon, label: 'Goal Cycles' },
    { to: '/admin/audit', icon: ShieldCheckIcon, label: 'Audit Logs' },
    { to: '/reports', icon: DocumentChartBarIcon, label: 'Reports' },
    { to: '/notifications', icon: BellIcon, label: 'Notifications' },
    { to: '/profile', icon: UserCircleIcon, label: 'Profile' },
  ],
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notifications);

  const items = navItems[user?.role] || navItems.employee;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 68 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-dark-800 border-r border-gray-100 dark:border-gray-700/50 z-30 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <ChartBarIcon className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="ml-3 overflow-hidden"
            >
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">GoalSync Pro</p>
              <p className="text-xs text-gray-400 whitespace-nowrap">Goal Management</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} relative`
            }
            title={!sidebarOpen ? label : undefined}
          >
            <div className="relative flex-shrink-0">
              <Icon className="h-5 w-5" />
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap text-sm"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700/50 space-y-1 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap text-sm">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="absolute top-1/2 -right-3 w-6 h-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        {sidebarOpen
          ? <ChevronLeftIcon className="h-3 w-3 text-gray-500" />
          : <ChevronRightIcon className="h-3 w-3 text-gray-500" />
        }
      </button>
    </motion.aside>
  );
};

export default Sidebar;

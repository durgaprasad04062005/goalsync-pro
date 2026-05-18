import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon, FlagIcon, ChartBarIcon, ShieldCheckIcon,
  ClipboardDocumentListIcon, BuildingOfficeIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import KPICard from '../components/ui/KPICard';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getDashboardStatsAPI } from '../api/adminAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStatsAPI().then(({ data }) => {
      setStats(data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { label: 'User Management', desc: 'Create, edit, deactivate users', icon: UsersIcon, to: '/admin/users', color: 'blue' },
    { label: 'Goal Cycles', desc: 'Manage performance cycles', icon: ClipboardDocumentListIcon, to: '/admin/cycles', color: 'green' },
    { label: 'Audit Logs', desc: 'View all system changes', icon: ShieldCheckIcon, to: '/admin/audit', color: 'purple' },
    { label: 'Reports', desc: 'Download CSV/Excel reports', icon: ChartBarIcon, to: '/reports', color: 'orange' },
  ];

  if (loading) return <Layout title="Admin Panel"><LoadingSpinner /></Layout>;

  const statusChartData = stats ? [
    { name: 'Approved', value: stats.approvedGoals, fill: '#10b981' },
    { name: 'Submitted', value: stats.submittedGoals, fill: '#3b82f6' },
    { name: 'Other', value: Math.max(0, stats.totalGoals - stats.approvedGoals - stats.submittedGoals), fill: '#6b7280' },
  ].filter((d) => d.value > 0) : [];

  return (
    <Layout title="Admin Panel" subtitle="System-wide management and analytics">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Employees" value={stats?.totalEmployees || 0} icon={UsersIcon} color="blue" />
          <KPICard title="Total Managers" value={stats?.totalManagers || 0} icon={UsersIcon} color="purple" />
          <KPICard title="Total Goals" value={stats?.totalGoals || 0} icon={FlagIcon} color="green" />
          <KPICard title="Completion Rate" value={`${stats?.completionRate || 0}%`} icon={ChartBarIcon} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Actions</h3>
            {quickLinks.map(({ label, desc, icon: Icon, to, color }) => (
              <motion.div
                key={to}
                whileHover={{ x: 3 }}
                onClick={() => navigate(to)}
                className="card p-4 cursor-pointer hover:shadow-card-hover transition-all flex items-center gap-3"
              >
                <div className={`p-2.5 rounded-xl ${
                  color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                  color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20' :
                  'bg-orange-50 dark:bg-orange-900/20'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    color === 'green' ? 'text-green-600 dark:text-green-400' :
                    color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                    'text-orange-600 dark:text-orange-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-300" />
              </motion.div>
            ))}
          </div>

          {/* Goal status chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Goal Status Distribution" subtitle="Across all employees" />
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available</div>
              )}
            </Card>
          </div>
        </div>

        {/* Active cycle info */}
        {stats?.activeCycle && (
          <Card>
            <CardHeader title="Active Goal Cycle" icon={ClipboardDocumentListIcon} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Cycle Name', value: stats.activeCycle.name },
                { label: 'Start Date', value: stats.activeCycle.startDate },
                { label: 'End Date', value: stats.activeCycle.endDate },
                { label: 'Status', value: 'Active' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminPage;

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FlagIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon,
  UsersIcon, ChartBarIcon, ArrowRightIcon, PlusIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import KPICard from '../components/ui/KPICard';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getMyGoalsAPI } from '../api/goalAPI';
import { getTeamGoalsAPI } from '../api/goalAPI';
import { getDashboardStatsAPI } from '../api/adminAPI';
import { formatDate, truncateText, getId } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ goals: [], stats: null, teamGoals: [] });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const promises = [getMyGoalsAPI({})];
        if (user?.role === 'manager') {
          // Get active cycle first, then fetch team goals with it
          const cyclesRes = await getMyGoalsAPI({}).catch(() => ({ data: { data: [] } }));
          promises.push(getTeamGoalsAPI({ status: 'submitted' }));
        }
        if (user?.role === 'admin') promises.push(getDashboardStatsAPI());

        const results = await Promise.allSettled(promises);
        const goals = results[0].status === 'fulfilled' ? results[0].value.data.data : [];
        const extra = results[1]?.status === 'fulfilled' ? results[1].value.data.data : null;

        setData({
          goals,
          stats: user?.role === 'admin' ? extra : null,
          teamGoals: user?.role === 'manager' ? (Array.isArray(extra) ? extra : []) : [],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const myGoals = data.goals;
  const approved = myGoals.filter((g) => g.status === 'approved').length;
  const submitted = myGoals.filter((g) => g.status === 'submitted').length;
  const draft = myGoals.filter((g) => g.status === 'draft').length;
  const returned = myGoals.filter((g) => g.status === 'returned').length;

  const statusData = [
    { name: 'Approved', value: approved, color: '#10b981' },
    { name: 'Submitted', value: submitted, color: '#3b82f6' },
    { name: 'Draft', value: draft, color: '#6b7280' },
    { name: 'Returned', value: returned, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  if (loading) return <Layout title="Dashboard"><LoadingSpinner /></Layout>;

  return (
    <Layout title="Dashboard" subtitle={`Welcome back, ${user?.firstName}!`}>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Goals" value={myGoals.length} icon={FlagIcon} color="blue" subtitle="This cycle" />
          <KPICard title="Approved" value={approved} icon={CheckCircleIcon} color="green" subtitle="Ready for tracking" />
          <KPICard title="Pending Review" value={submitted} icon={ClockIcon} color="orange" subtitle="Awaiting manager" />
          <KPICard title="Action Required" value={draft + returned} icon={ExclamationTriangleIcon} color="red" subtitle="Draft or returned" />
        </div>

        {/* Admin stats */}
        {user?.role === 'admin' && data.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Employees" value={data.stats.totalEmployees} icon={UsersIcon} color="blue" />
            <KPICard title="Total Managers" value={data.stats.totalManagers} icon={UsersIcon} color="purple" />
            <KPICard title="All Goals" value={data.stats.totalGoals} icon={FlagIcon} color="green" />
            <KPICard title="Completion Rate" value={`${data.stats.completionRate}%`} icon={ChartBarIcon} color="orange" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="My Goals"
                subtitle="Current cycle overview"
                action={
                  <Button size="sm" variant="ghost" onClick={() => navigate('/goals')} iconRight={ArrowRightIcon}>
                    View All
                  </Button>
                }
              />
              {myGoals.length === 0 ? (
                <div className="text-center py-10">
                  <FlagIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No goals yet</p>
                  <Button size="sm" className="mt-3" icon={PlusIcon} onClick={() => navigate('/goals/create')}>
                    Create First Goal
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myGoals.slice(0, 5).map((goal, i) => {
                    const gid = getId(goal);
                    return (
                    <motion.div
                      key={gid || i}
                      whileHover={{ x: 2 }}
                      onClick={() => navigate(`/goals/${gid}`)}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {truncateText(goal.title, 50)}
                          </p>
                          <Badge status={goal.status} size="xs" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{goal.thrustArea} · {goal.weightage}% weight</p>
                        {goal.achievements?.length > 0 && (
                          <ProgressBar
                            value={goal.achievements[goal.achievements.length - 1]?.progressPercentage || 0}
                            size="xs"
                            showLabel={false}
                            className="mt-2"
                          />
                        )}
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Status chart */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Goal Status" subtitle="Distribution" />
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
              )}
              <div className="space-y-1.5 mt-2">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <div className="space-y-2">
                {user?.role === 'employee' && (
                  <>
                    <Button fullWidth variant="outline" size="sm" icon={PlusIcon} onClick={() => navigate('/goals/create')}>
                      Create New Goal
                    </Button>
                    <Button fullWidth variant="outline" size="sm" onClick={() => navigate('/achievements')}>
                      Update Achievements
                    </Button>
                  </>
                )}
                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <>
                    <Button fullWidth variant="outline" size="sm" onClick={() => navigate('/team')}>
                      Review Team Goals
                    </Button>
                    <Button fullWidth variant="outline" size="sm" onClick={() => navigate('/reports')}>
                      Generate Report
                    </Button>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Button fullWidth variant="outline" size="sm" onClick={() => navigate('/admin')}>
                    Admin Panel
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Manager: Team overview */}
        {user?.role === 'manager' && data.teamGoals.length > 0 && (
          <Card>
            <CardHeader
              title="Team Goals Overview"
              subtitle="Pending approvals and recent submissions"
              action={<Button size="sm" variant="ghost" onClick={() => navigate('/team')} iconRight={ArrowRightIcon}>View Team</Button>}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Employee</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Goal</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Weightage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teamGoals.filter((g) => g.status === 'submitted').slice(0, 5).map((goal) => {
                    const emp = goal.employee || goal.userId || {};
                    return (
                    <tr key={getId(goal)} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer" onClick={() => navigate(`/goals/${getId(goal)}`)}>
                      <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{truncateText(goal.title, 40)}</td>
                      <td className="py-2.5 px-3"><Badge status={goal.status} size="xs" /></td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{goal.weightage}%</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;

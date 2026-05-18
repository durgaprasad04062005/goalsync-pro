import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { UsersIcon, MagnifyingGlassIcon, FunnelIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import KPICard from '../components/ui/KPICard';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getTeamGoalsAPI } from '../api/goalAPI';
import api from '../api/axios';
import { truncateText, getInitials } from '../utils/helpers';
import { getGoalCyclesAPI } from '../api/adminAPI';

const TeamPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [teamGoals, setTeamGoals] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [cyclesRes, membersRes] = await Promise.all([
          getGoalCyclesAPI(),
          api.get('/users/team'),
        ]);
        const activeCycles = cyclesRes.data.data;
        setCycles(activeCycles);
        setTeamMembers(membersRes.data.data);
        const active = activeCycles.find((c) => c.isActive);
        if (active) setSelectedCycle(active.id);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCycle) return;
    const load = async () => {
      setLoading(true);
      try {
        const params = { cycleId: selectedCycle };
        if (statusFilter) params.status = statusFilter;
        if (selectedEmployee) params.userId = selectedEmployee;
        const { data } = await getTeamGoalsAPI(params);
        setTeamGoals(data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [selectedCycle, statusFilter, selectedEmployee]);

  const filtered = teamGoals.filter((g) =>
    !search || g.title.toLowerCase().includes(search.toLowerCase()) ||
    `${g.employee?.firstName} ${g.employee?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingApprovals = teamGoals.filter((g) => g.status === 'submitted').length;
  const approved = teamGoals.filter((g) => g.status === 'approved').length;
  const totalProgress = teamGoals.reduce((s, g) => {
    const lastAch = g.achievements?.[g.achievements.length - 1];
    return s + (lastAch?.progressPercentage || 0);
  }, 0);
  const avgProgress = teamGoals.length > 0 ? (totalProgress / teamGoals.length).toFixed(1) : 0;

  return (
    <Layout title="Team Management" subtitle="Monitor and manage your team's goals">
      <div className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Team Members" value={teamMembers.length} icon={UsersIcon} color="blue" />
          <KPICard title="Pending Approvals" value={pendingApprovals} icon={ClockIcon} color="orange" />
          <KPICard title="Approved Goals" value={approved} icon={CheckCircleIcon} color="green" />
          <KPICard title="Avg Progress" value={`${avgProgress}%`} icon={CheckCircleIcon} color="purple" />
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search goals or employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
            </div>
            <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="input-field text-sm w-40">
              {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field text-sm w-36">
              <option value="">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="returned">Returned</option>
            </select>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="input-field text-sm w-44">
              <option value="">All Employees</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Team members overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {teamMembers.map((member) => {
            const memberGoals = teamGoals.filter((g) => g.userId === member.id);
            const memberApproved = memberGoals.filter((g) => g.status === 'approved').length;
            const memberPending = memberGoals.filter((g) => g.status === 'submitted').length;
            return (
              <motion.div
                key={member.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedEmployee(selectedEmployee === member.id ? '' : member.id)}
                className={`card p-4 cursor-pointer text-center transition-all ${selectedEmployee === member.id ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold mx-auto mb-2">
                  {getInitials(member.firstName, member.lastName)}
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{member.firstName} {member.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{member.designation || member.role}</p>
                <div className="flex justify-center gap-2 mt-2">
                  {memberPending > 0 && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{memberPending} pending</span>}
                  {memberApproved > 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">{memberApproved} approved</span>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Goals table */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Team Goals {filtered.length > 0 && <span className="text-sm font-normal text-gray-400 ml-1">({filtered.length})</span>}
            </h3>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No goals found" description="Try adjusting your filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/30">
                  <tr>
                    {['Employee', 'Goal', 'Thrust Area', 'Weightage', 'Status', 'Progress', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((goal) => {
                    const lastAch = goal.achievements?.[goal.achievements.length - 1];
                    return (
                      <tr key={goal.id} className="border-t border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold">
                              {getInitials(goal.employee?.firstName, goal.employee?.lastName)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{goal.employee?.firstName} {goal.employee?.lastName}</p>
                              <p className="text-gray-400 text-xs">{goal.employee?.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-gray-900 dark:text-gray-100 font-medium text-xs">{truncateText(goal.title, 45)}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">{goal.thrustArea}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs font-medium">{goal.weightage}%</td>
                        <td className="py-3 px-4"><Badge status={goal.status} size="xs" /></td>
                        <td className="py-3 px-4 w-32">
                          {lastAch ? (
                            <ProgressBar value={lastAch.progressPercentage} size="xs" showLabel={false} />
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <Button size="xs" variant="ghost" onClick={() => navigate(`/goals/${goal.id}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default TeamPage;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getMyAchievementsAPI } from '../api/achievementAPI';
import { getGoalCyclesAPI } from '../api/adminAPI';
import { QUARTERS } from '../utils/constants';
import { truncateText, getId } from '../utils/helpers';

const AchievementsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [cycles, setCycles]             = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [activeQuarter, setActiveQuarter] = useState('Q1');

  useEffect(() => {
    getGoalCyclesAPI()
      .then(({ data }) => {
        const list = data.data || [];
        setCycles(list);
        const active = list.find((c) => c.isActive);
        if (active) setSelectedCycle(getId(active) || active._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getMyAchievementsAPI({ cycleId: selectedCycle || undefined })
      .then(({ data }) => setAchievements(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCycle]);

  const quarterAchievements = achievements.filter((a) => a.quarter === activeQuarter);
  const overallProgress = achievements.length > 0
    ? (achievements.reduce((s, a) => s + (a.progressPercentage || 0), 0) / achievements.length).toFixed(1)
    : 0;

  // goal data is nested under ach.goalId (populated object)
  const getGoal = (ach) => ach.goalId || ach.goal || {};
  const getGoalNavId = (ach) => getId(ach.goalId) || getId(ach.goal) || ach.goalId;

  return (
    <Layout title="Quarterly Achievements" subtitle="Track your progress across all quarters">
      <div className="space-y-5">

        {/* ── Controls ── */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            {QUARTERS.map(({ value }) => (
              <button
                key={value}
                onClick={() => setActiveQuarter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeQuarter === value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="input-field text-sm w-44"
          >
            <option value="">All Cycles</option>
            {cycles.map((c) => (
              <option key={getId(c) || c._id} value={getId(c) || c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Goals Tracked',      value: achievements.length },
            { label: `${activeQuarter} Achievements`, value: quarterAchievements.length },
            { label: 'Overall Avg Progress',     value: `${overallProgress}%` },
          ].map(({ label, value }) => (
            <Card key={label} className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </Card>
          ))}
        </div>

        {/* ── Quarter detail ── */}
        <Card>
          <CardHeader
            title={`${activeQuarter} Achievements`}
            subtitle={QUARTERS.find((q) => q.value === activeQuarter)?.label}
          />
          {loading ? (
            <LoadingSpinner />
          ) : quarterAchievements.length === 0 ? (
            <EmptyState
              icon={ChartBarIcon}
              title={`No ${activeQuarter} achievements yet`}
              description="Update your achievements from the goal detail page"
            />
          ) : (
            <div className="space-y-4">
              {quarterAchievements.map((ach, i) => {
                const goal    = getGoal(ach);
                const goalId  = getGoalNavId(ach);
                return (
                  <motion.div
                    key={getId(ach) || i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer transition-all"
                    onClick={() => goalId && navigate(`/goals/${goalId}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-0.5">
                          {goal.thrustArea || '—'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {truncateText(goal.title, 60)}
                        </p>
                      </div>
                      <Badge status={ach.status} size="xs" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                      <div>
                        <p className="text-gray-400">Target</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{goal.target ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Actual</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{ach.actualAchievement ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Weightage</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {goal.weightage != null ? `${goal.weightage}%` : '—'}
                        </p>
                      </div>
                    </div>

                    <ProgressBar value={ach.progressPercentage || 0} size="sm" />

                    {ach.employeeComment && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">"{ach.employeeComment}"</p>
                    )}
                    {ach.managerComment && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <strong>Manager:</strong> {ach.managerComment}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── All quarters summary ── */}
        <Card>
          <CardHeader title="All Quarters Summary" subtitle="Progress across Q1–Q4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {QUARTERS.map(({ value: q, label }) => {
              const qAchs   = achievements.filter((a) => a.quarter === q);
              const avgProg = qAchs.length > 0
                ? (qAchs.reduce((s, a) => s + (a.progressPercentage || 0), 0) / qAchs.length).toFixed(1)
                : null;
              return (
                <div
                  key={q}
                  onClick={() => setActiveQuarter(q)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    activeQuarter === q
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                  }`}
                >
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{q}</p>
                  <p className="text-xs text-gray-400 mb-2">{qAchs.length} goals</p>
                  {avgProg !== null
                    ? <ProgressBar value={parseFloat(avgProg)} size="xs" showLabel={false} />
                    : <p className="text-xs text-gray-400">No data</p>
                  }
                  {avgProg !== null && (
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">{avgProg}% avg</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AchievementsPage;

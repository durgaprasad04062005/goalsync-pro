import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, FunnelIcon, MagnifyingGlassIcon, FlagIcon,
  PencilIcon, TrashIcon, PaperAirplaneIcon, CheckIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { fetchMyGoals, deleteGoal, submitGoals } from '../store/slices/goalSlice';
import { truncateText, getUomLabel } from '../utils/helpers';
import { GOAL_STATUS } from '../utils/constants';
import toast from 'react-hot-toast';

const GoalsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myGoals, loading, submitting } = useSelector((state) => state.goals);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [activeCycleId, setActiveCycleId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyGoals({}));
  }, [dispatch]);

  useEffect(() => {
    if (myGoals.length > 0 && myGoals[0].cycleId) {
      setActiveCycleId(myGoals[0].cycleId);
    }
  }, [myGoals]);

  const filtered = myGoals.filter((g) => {
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.thrustArea.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalWeightage = myGoals.filter((g) => ['draft', 'returned'].includes(g.status)).reduce((s, g) => s + g.weightage, 0);
  const canSubmit = myGoals.some((g) => ['draft', 'returned'].includes(g.status));

  const handleDelete = async () => {
    if (!deleteModal) return;
    const result = await dispatch(deleteGoal(deleteModal.id));
    if (!result.error) {
      toast.success('Goal deleted');
      setDeleteModal(null);
    } else {
      toast.error(result.payload || 'Failed to delete');
    }
  };

  const handleSubmit = async () => {
    if (!activeCycleId) return toast.error('No active cycle found');
    const result = await dispatch(submitGoals({ cycleId: activeCycleId }));
    if (!result.error) {
      toast.success('Goals submitted for approval');
      setSubmitModal(false);
    } else {
      toast.error(result.payload || 'Submission failed');
    }
  };

  return (
    <Layout title="My Goals" subtitle="Manage and track your performance goals">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search goals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm w-36"
            >
              <option value="">All Status</option>
              {Object.values(GOAL_STATUS).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {canSubmit && (
              <Button
                variant="success"
                size="sm"
                icon={PaperAirplaneIcon}
                onClick={() => setSubmitModal(true)}
                loading={submitting}
              >
                Submit for Approval
              </Button>
            )}
            {user?.role === 'employee' && (
              <Button size="sm" icon={PlusIcon} onClick={() => navigate('/goals/create')}>
                New Goal
              </Button>
            )}
          </div>
        </div>

        {/* Weightage indicator */}
        {canSubmit && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
              Math.abs(totalWeightage - 100) < 0.01
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${Math.abs(totalWeightage - 100) < 0.01 ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className={Math.abs(totalWeightage - 100) < 0.01 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
              Total weightage: <strong>{totalWeightage.toFixed(1)}%</strong>
              {Math.abs(totalWeightage - 100) < 0.01
                ? ' ✓ Ready to submit'
                : ` — needs to equal 100% (${totalWeightage < 100 ? `add ${(100 - totalWeightage).toFixed(1)}%` : `reduce by ${(totalWeightage - 100).toFixed(1)}%`})`
              }
            </span>
          </motion.div>
        )}

        {/* Goals grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FlagIcon}
            title="No goals found"
            description={search || statusFilter ? 'Try adjusting your filters' : 'Start by creating your first goal for this cycle'}
            action={!search && !statusFilter && user?.role === 'employee' ? () => navigate('/goals/create') : undefined}
            actionLabel="Create First Goal"
            actionIcon={PlusIcon}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((goal, i) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer"
                  onClick={() => navigate(`/goals/${goal.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">{goal.thrustArea}</p>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {truncateText(goal.title, 60)}
                      </h3>
                    </div>
                    <Badge status={goal.status} size="xs" />
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="block text-gray-400 dark:text-gray-500">UoM</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{getUomLabel(goal.uom)}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 dark:text-gray-500">Target</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{goal.target}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 dark:text-gray-500">Weightage</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{goal.weightage}%</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 dark:text-gray-500">Shared</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{goal.isShared ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  {goal.achievements?.length > 0 && (
                    <ProgressBar
                      value={goal.achievements[goal.achievements.length - 1]?.progressPercentage || 0}
                      size="sm"
                    />
                  )}

                  {/* Manager comment */}
                  {goal.managerComment && goal.status === 'returned' && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        <strong>Manager:</strong> {truncateText(goal.managerComment, 80)}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {['draft', 'returned'].includes(goal.status) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        variant="outline"
                        icon={PencilIcon}
                        onClick={() => navigate(`/goals/${goal.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={TrashIcon}
                        onClick={() => setDeleteModal(goal)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Goal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Goal</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>"{deleteModal?.title}"</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* Submit confirmation modal */}
      <Modal
        isOpen={submitModal}
        onClose={() => setSubmitModal(false)}
        title="Submit Goals for Approval"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitModal(false)}>Cancel</Button>
            <Button
              variant="success"
              onClick={handleSubmit}
              loading={submitting}
              disabled={Math.abs(totalWeightage - 100) > 0.01}
            >
              Submit Goals
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are about to submit {myGoals.filter((g) => ['draft', 'returned'].includes(g.status)).length} goal(s) for manager approval.
          </p>
          <div className={`p-3 rounded-lg text-sm ${Math.abs(totalWeightage - 100) < 0.01 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
            Total weightage: <strong>{totalWeightage.toFixed(1)}%</strong>
            {Math.abs(totalWeightage - 100) > 0.01 && ' — Must equal 100% before submitting'}
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default GoalsPage;

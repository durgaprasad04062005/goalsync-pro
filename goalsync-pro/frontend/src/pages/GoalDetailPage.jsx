import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon, CheckCircleIcon, XCircleIcon, PencilIcon,
  ChatBubbleLeftIcon, LockClosedIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getGoalByIdAPI, approveGoalAPI, returnGoalAPI } from '../api/goalAPI';
import { updateAchievementAPI, getAchievementsAPI } from '../api/achievementAPI';
import { formatDate, getUomLabel, calculateProgress } from '../utils/helpers';
import { QUARTERS, ACHIEVEMENT_STATUS } from '../utils/constants';
import toast from 'react-hot-toast';

const GoalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [goal, setGoal] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [achievementModal, setAchievementModal] = useState(null);
  const [comment, setComment] = useState('');
  const [achievementForm, setAchievementForm] = useState({ actualAchievement: '', status: 'on_track', employeeComment: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [goalRes, achRes] = await Promise.all([
        getGoalByIdAPI(id),
        getAchievementsAPI(id),
      ]);
      setGoal(goalRes.data.data);
      setAchievements(achRes.data.data);
    } catch (e) {
      toast.error('Failed to load goal');
      navigate('/goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    setSaving(true);
    try {
      await approveGoalAPI(id, { comment });
      toast.success('Goal approved');
      setApproveModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to approve');
    } finally { setSaving(false); }
  };

  const handleReturn = async () => {
    if (!comment.trim()) return toast.error('Comment is required');
    setSaving(true);
    try {
      await returnGoalAPI(id, { comment });
      toast.success('Goal returned for revision');
      setReturnModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to return');
    } finally { setSaving(false); }
  };

  const handleUpdateAchievement = async () => {
    if (!achievementModal) return;
    setSaving(true);
    try {
      await updateAchievementAPI({
        goalId: id,
        quarter: achievementModal.quarter,
        year: new Date().getFullYear(),
        ...achievementForm,
        actualAchievement: parseFloat(achievementForm.actualAchievement),
      });
      toast.success('Achievement updated');
      setAchievementModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  if (loading) return <Layout title="Goal Detail"><LoadingSpinner /></Layout>;
  if (!goal) return null;

  const isOwner = goal.userId === user?.id;
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const canEdit = isOwner && ['draft', 'returned'].includes(goal.status);
  const canApprove = isManager && goal.status === 'submitted';
  const canUpdateAchievement = isOwner && ['approved', 'locked'].includes(goal.status);

  return (
    <Layout title="Goal Detail" subtitle={goal.thrustArea}>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" icon={ArrowLeftIcon} onClick={() => navigate(-1)}>Back</Button>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" icon={PencilIcon}>Edit Goal</Button>
            )}
            {canApprove && (
              <>
                <Button variant="success" size="sm" icon={CheckCircleIcon} onClick={() => setApproveModal(true)}>
                  Approve
                </Button>
                <Button variant="danger" size="sm" icon={XCircleIcon} onClick={() => setReturnModal(true)}>
                  Return
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Goal info */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                  {goal.thrustArea}
                </span>
                <Badge status={goal.status} />
                {goal.isShared && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded font-medium">
                    Shared Goal
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{goal.title}</h2>
              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{goal.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'UoM', value: getUomLabel(goal.uom) },
              { label: 'Target', value: goal.target },
              { label: 'Weightage', value: `${goal.weightage}%` },
              { label: 'Deadline', value: formatDate(goal.deadline) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>

          {goal.managerComment && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${goal.status === 'returned' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
              <strong>Manager Comment:</strong> {goal.managerComment}
            </div>
          )}

          {goal.approvedAt && (
            <p className="text-xs text-gray-400 mt-3">
              Approved on {formatDate(goal.approvedAt, 'MMM dd, yyyy HH:mm')}
            </p>
          )}
        </Card>

        {/* Quarterly Achievements */}
        <Card>
          <CardHeader title="Quarterly Achievements" subtitle="Track your progress each quarter" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUARTERS.map(({ value: q, label }) => {
              const ach = achievements.find((a) => a.quarter === q);
              const progress = ach ? ach.progressPercentage : 0;

              return (
                <motion.div
                  key={q}
                  whileHover={{ y: -1 }}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{q}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                    {ach && <Badge status={ach.status} size="xs" />}
                  </div>

                  {ach ? (
                    <>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500">Actual: <strong className="text-gray-900 dark:text-gray-100">{ach.actualAchievement}</strong></span>
                        <span className="text-gray-500">Target: <strong className="text-gray-900 dark:text-gray-100">{goal.target}</strong></span>
                      </div>
                      <ProgressBar value={progress} size="sm" />
                      {ach.employeeComment && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{ach.employeeComment}"</p>
                      )}
                      {ach.managerComment && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          <strong>Manager:</strong> {ach.managerComment}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 mb-3">No data yet</p>
                  )}

                  {canUpdateAchievement && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        setAchievementModal({ quarter: q });
                        setAchievementForm({
                          actualAchievement: ach?.actualAchievement || '',
                          status: ach?.status || 'on_track',
                          employeeComment: ach?.employeeComment || '',
                        });
                      }}
                    >
                      {ach ? 'Update' : 'Add'} Achievement
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Approve Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Approve Goal"
        footer={<>
          <Button variant="secondary" onClick={() => setApproveModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleApprove} loading={saving}>Approve Goal</Button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Approving: <strong>{goal.title}</strong></p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comment (optional)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input-field resize-none" placeholder="Add a comment..." />
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={returnModal} onClose={() => setReturnModal(false)} title="Return Goal for Revision"
        footer={<>
          <Button variant="secondary" onClick={() => setReturnModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReturn} loading={saving}>Return Goal</Button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Returning: <strong>{goal.title}</strong></p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason <span className="text-red-500">*</span></label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input-field resize-none" placeholder="Explain what needs to be revised..." />
          </div>
        </div>
      </Modal>

      {/* Achievement Modal */}
      <Modal isOpen={!!achievementModal} onClose={() => setAchievementModal(null)} title={`Update ${achievementModal?.quarter} Achievement`}
        footer={<>
          <Button variant="secondary" onClick={() => setAchievementModal(null)}>Cancel</Button>
          <Button onClick={handleUpdateAchievement} loading={saving}>Save Achievement</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actual Achievement <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={achievementForm.actualAchievement}
              onChange={(e) => setAchievementForm({ ...achievementForm, actualAchievement: e.target.value })}
              className="input-field"
              placeholder={`Target: ${goal.target}`}
              step="any"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select value={achievementForm.status} onChange={(e) => setAchievementForm({ ...achievementForm, status: e.target.value })} className="input-field">
              {ACHIEVEMENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comment</label>
            <textarea value={achievementForm.employeeComment} onChange={(e) => setAchievementForm({ ...achievementForm, employeeComment: e.target.value })} rows={3} className="input-field resize-none" placeholder="Describe your progress..." />
          </div>
          {achievementForm.actualAchievement && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
              Estimated progress: <strong>{calculateProgress(goal.uom, goal.target, parseFloat(achievementForm.actualAchievement)).toFixed(1)}%</strong>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default GoalDetailPage;

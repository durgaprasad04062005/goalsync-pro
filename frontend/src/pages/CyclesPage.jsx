import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getGoalCyclesAPI, createGoalCycleAPI, updateGoalCycleAPI } from '../api/adminAPI';
import { formatDate, getId } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY = { name: '', startDate: '', endDate: '', description: '', isActive: false };

// Convert ISO date string to YYYY-MM-DD for <input type="date">
const toDateInput = (val) => {
  if (!val) return '';
  return String(val).split('T')[0];
};

const CyclesPage = () => {
  const [cycles, setCycles]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [editCycle, setEditCycle] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getGoalCyclesAPI();
      setCycles(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditCycle(null); setModal('form'); };

  const openEdit = (c) => {
    setForm({
      name:        c.name        || '',
      startDate:   toDateInput(c.startDate),
      endDate:     toDateInput(c.endDate),
      description: c.description || '',
      isActive:    c.isActive    || false,
    });
    setEditCycle(c);
    setModal('form');
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate)
      return toast.error('Name, start and end dates are required');
    setSaving(true);
    try {
      if (editCycle) {
        await updateGoalCycleAPI(getId(editCycle) || editCycle._id, form);
        toast.success('Cycle updated');
      } else {
        await createGoalCycleAPI(form);
        toast.success('Cycle created');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleActivate = async (cycle) => {
    setSaving(true);
    try {
      await updateGoalCycleAPI(getId(cycle) || cycle._id, {
        name:        cycle.name,
        startDate:   toDateInput(cycle.startDate),
        endDate:     toDateInput(cycle.endDate),
        description: cycle.description,
        isActive:    true,
      });
      toast.success(`${cycle.name} is now the active cycle`);
      load();
    } catch (e) {
      toast.error('Failed to activate cycle');
    } finally { setSaving(false); }
  };

  return (
    <Layout title="Goal Cycles" subtitle="Manage performance review cycles">
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button icon={PlusIcon} onClick={openCreate}>New Cycle</Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : cycles.length === 0 ? (
          <EmptyState icon={PlusIcon} title="No cycles yet" description="Create your first goal cycle" action={openCreate} actionLabel="Create Cycle" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.map((cycle) => {
              const cid = getId(cycle) || cycle._id;
              return (
                <Card key={cid} className={cycle.isActive ? 'ring-2 ring-primary-500' : ''}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{cycle.name}</h3>
                      {cycle.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{cycle.description}</p>
                      )}
                    </div>
                    {cycle.isActive && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex justify-between">
                      <span>Start Date</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(cycle.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(cycle.endDate)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" icon={PencilIcon} onClick={() => openEdit(cycle)}>
                      Edit
                    </Button>
                    {!cycle.isActive && (
                      <Button size="xs" variant="success" icon={CheckCircleIcon} onClick={() => handleActivate(cycle)}>
                        Set Active
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title={editCycle ? 'Edit Goal Cycle' : 'Create Goal Cycle'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {editCycle ? 'Save Changes' : 'Create Cycle'}
          </Button>
        </>}
      >
        <div className="space-y-4">
          <Input
            label="Cycle Name" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. FY 2025-26"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date" required type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date" required type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="input-field resize-none"
              placeholder="Optional description..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded text-primary-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Set as active cycle <span className="text-gray-400">(deactivates all others)</span>
            </span>
          </label>
        </div>
      </Modal>
    </Layout>
  );
};

export default CyclesPage;

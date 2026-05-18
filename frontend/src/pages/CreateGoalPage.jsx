import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { createGoal, fetchMyGoals } from '../store/slices/goalSlice';
import { getGoalCyclesAPI } from '../api/adminAPI';
import { UOM_TYPES, THRUST_AREAS } from '../utils/constants';
import { getId } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = ['Basic Info', 'Measurement', 'Weightage', 'Review'];

const CreateGoalPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { myGoals } = useSelector((s) => s.goals);

  const [step, setStep]     = useState(0);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({
    cycleId: '', thrustArea: '', title: '', description: '',
    uom: '', target: '', weightage: '', deadline: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getGoalCyclesAPI()
      .then(({ data }) => {
        const all    = data.data || [];
        const active = all.filter((c) => c.isActive);
        const list   = active.length > 0 ? active : all;
        setCycles(list);
        if (list.length > 0) {
          // Use getId() to safely get _id or id
          setForm((f) => ({ ...f, cycleId: getId(list[0]) || list[0]._id || list[0].id }));
        }
      })
      .catch(() => toast.error('Failed to load goal cycles'));
    dispatch(fetchMyGoals({}));
  }, [dispatch]);

  // Compare cycleId safely — goal.cycleId may be a populated object
  const currentCycleGoals = myGoals.filter((g) => {
    const gCycleId = getId(g.cycleId) || g.cycleId;
    return String(gCycleId) === String(form.cycleId);
  });
  const totalExistingWeightage = currentCycleGoals.reduce((s, g) => s + (g.weightage || 0), 0);
  const remainingWeightage     = 100 - totalExistingWeightage;

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.cycleId)          e.cycleId    = 'Please select a goal cycle';
      if (!form.thrustArea)       e.thrustArea = 'Thrust area is required';
      if (!form.title?.trim())    e.title      = 'Goal title is required';
      if (form.title?.length < 3) e.title      = 'Title must be at least 3 characters';
    }
    if (step === 1) {
      if (!form.uom)                                              e.uom    = 'Unit of measurement is required';
      if (!form.target || isNaN(form.target) || parseFloat(form.target) <= 0) e.target = 'Valid target value is required';
    }
    if (step === 2) {
      const w = parseFloat(form.weightage);
      if (!form.weightage || isNaN(w))          e.weightage = 'Weightage is required';
      else if (w < 10)                           e.weightage = 'Minimum weightage is 10%';
      else if (w > 100)                          e.weightage = 'Maximum weightage is 100%';
      else if (w > remainingWeightage + 0.01)    e.weightage = `Max available: ${remainingWeightage.toFixed(1)}%`;
      if (currentCycleGoals.length >= 8)         e.general   = 'Maximum 8 goals per cycle reached';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await dispatch(createGoal({
        ...form,
        target:    parseFloat(form.target),
        weightage: parseFloat(form.weightage),
      }));
      if (!result.error) {
        toast.success('Goal created successfully');
        navigate('/goals');
      } else {
        toast.error(result.payload || 'Failed to create goal');
      }
    } finally {
      setLoading(false);
    }
  };

  const uomInfo = UOM_TYPES.find((u) => u.value === form.uom);

  return (
    <Layout title="Create New Goal" subtitle="Define your performance goal for this cycle">
      <div className="max-w-2xl mx-auto">

        {/* ── Step indicator ── */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                i < step  ? 'bg-green-500 text-white' :
                i === step ? 'bg-primary-600 text-white' :
                             'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}>
                {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${
                i === step ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
              }`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* ── Step 0: Basic Info ── */}
              {step === 0 && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Basic Information</h2>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Goal Cycle <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.cycleId}
                      onChange={(e) => setForm({ ...form, cycleId: e.target.value })}
                      className={`input-field ${errors.cycleId ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select cycle</option>
                      {cycles.map((c) => (
                        <option key={getId(c) || c._id} value={getId(c) || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.cycleId && <p className="text-xs text-red-600">{errors.cycleId}</p>}
                  </div>

                  <Select
                    label="Thrust Area" required
                    value={form.thrustArea}
                    onChange={(e) => setForm({ ...form, thrustArea: e.target.value })}
                    options={THRUST_AREAS.map((t) => ({ value: t, label: t }))}
                    placeholder="Select thrust area"
                    error={errors.thrustArea}
                  />
                  <Input
                    label="Goal Title" required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Reduce API response time by 40%"
                    error={errors.title}
                    helper={`${form.title.length}/300 characters`}
                    maxLength={300}
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the goal, success criteria, and approach..."
                      rows={4}
                      className="input-field resize-none"
                    />
                  </div>
                </>
              )}

              {/* ── Step 1: Measurement ── */}
              {step === 1 && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Measurement Setup</h2>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit of Measurement (UoM) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {UOM_TYPES.map((u) => (
                        <label
                          key={u.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            form.uom === u.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio" name="uom" value={u.value}
                            checked={form.uom === u.value}
                            onChange={(e) => setForm({ ...form, uom: e.target.value })}
                            className="mt-0.5 text-primary-600"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.uom && <p className="text-xs text-red-600">{errors.uom}</p>}
                  </div>
                  <Input
                    label="Target Value" required type="number"
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    placeholder="Enter target value"
                    error={errors.target}
                    helper={uomInfo ? `Formula: ${uomInfo.description}` : undefined}
                    min="0" step="any"
                  />
                  <Input
                    label="Deadline" type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </>
              )}

              {/* ── Step 2: Weightage ── */}
              {step === 2 && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal Weightage</h2>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">Existing goals weightage</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{totalExistingWeightage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">Available for this goal</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{remainingWeightage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">Goals in this cycle</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{currentCycleGoals.length} / 8</span>
                    </div>
                  </div>
                  {errors.general && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                      {errors.general}
                    </div>
                  )}
                  <Input
                    label="Weightage (%)" required type="number"
                    value={form.weightage}
                    onChange={(e) => setForm({ ...form, weightage: e.target.value })}
                    placeholder="e.g. 25"
                    error={errors.weightage}
                    helper="Minimum 10%, total across all goals must equal 100%"
                    min="10" max="100" step="5"
                  />
                  {form.weightage && !errors.weightage && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">New total weightage</span>
                        <span className={`font-semibold ${
                          Math.abs(totalExistingWeightage + parseFloat(form.weightage || 0) - 100) < 0.01
                            ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {(totalExistingWeightage + parseFloat(form.weightage || 0)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            totalExistingWeightage + parseFloat(form.weightage || 0) > 100
                              ? 'bg-red-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${Math.min(totalExistingWeightage + parseFloat(form.weightage || 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Step 3: Review ── */}
              {step === 3 && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Review & Save</h2>
                  <div className="space-y-0">
                    {[
                      { label: 'Cycle',       value: cycles.find((c) => (getId(c) || c._id) === form.cycleId)?.name || form.cycleId },
                      { label: 'Thrust Area', value: form.thrustArea },
                      { label: 'Goal Title',  value: form.title },
                      { label: 'Description', value: form.description || '—' },
                      { label: 'UoM',         value: UOM_TYPES.find((u) => u.value === form.uom)?.label },
                      { label: 'Target',      value: form.target },
                      { label: 'Weightage',   value: `${form.weightage}%` },
                      { label: 'Deadline',    value: form.deadline || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">{label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="flex justify-between mt-8 pt-5 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={step === 0 ? () => navigate('/goals') : back}
              icon={ChevronLeftIcon}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} iconRight={ChevronRightIcon}>Continue</Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} icon={CheckIcon}>
                Save as Draft
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateGoalPage;

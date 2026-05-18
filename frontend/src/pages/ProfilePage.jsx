import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserCircleIcon, KeyIcon, PencilIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { updateUser } from '../store/slices/authSlice';
import { updateProfileAPI, changePasswordAPI } from '../api/authAPI';
import { getInitials, formatDate, getRoleLabel } from '../utils/helpers';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', designation: user?.designation || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfileAPI(profileForm);
      dispatch(updateUser(data.data));
      toast.success('Profile updated');
      setEditMode(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPw(true);
    try {
      await changePasswordAPI({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  return (
    <Layout title="My Profile" subtitle="Manage your account settings">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Profile card */}
        <Card>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.designation || 'No designation set'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded font-medium capitalize">
                  {getRoleLabel(user?.role)}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                  {user?.employeeId}
                </span>
                {user?.department?.name && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    {user.department.name}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" icon={PencilIcon} onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {editMode && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
                <Input label="Last Name" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
              </div>
              <Input label="Designation" value={profileForm.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} />
              <div className="flex justify-end">
                <Button onClick={handleProfileSave} loading={saving}>Save Changes</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Account info */}
        <Card>
          <CardHeader title="Account Information" icon={UserCircleIcon} />
          <div className="space-y-3">
            {[
              { label: 'Email', value: user?.email },
              { label: 'Employee ID', value: user?.employeeId },
              { label: 'Role', value: getRoleLabel(user?.role) },
              { label: 'Department', value: user?.department?.name || '—' },
              { label: 'Manager', value: user?.manager ? `${user.manager.firstName} ${user.manager.lastName}` : '—' },
              { label: 'Last Login', value: user?.lastLogin ? formatDate(user.lastLogin, 'MMM dd, yyyy HH:mm') : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader title="Change Password" icon={KeyIcon} />
          <div className="space-y-4">
            <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            <Input label="New Password" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} helper="Minimum 8 characters" />
            <Input label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
            <div className="flex justify-end">
              <Button onClick={handlePasswordChange} loading={savingPw} icon={KeyIcon}>Change Password</Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfilePage;

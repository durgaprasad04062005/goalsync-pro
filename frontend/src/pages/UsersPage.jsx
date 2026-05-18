import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, UserMinusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getAllUsersAPI, createUserAPI, updateUserAPI, deactivateUserAPI, getAllDepartmentsAPI } from '../api/adminAPI';
import api from '../api/axios';
import { getInitials, formatDate, getId } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  employeeId: '', firstName: '', lastName: '', email: '',
  password: '', role: 'employee', managerId: '', departmentId: '', designation: '',
};

const UsersPage = () => {
  const [users, setUsers]           = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal]           = useState(null);
  const [editUser, setEditUser]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes, mgrsRes] = await Promise.all([
        getAllUsersAPI({ page, limit: 20, search: search || undefined, role: roleFilter || undefined }),
        getAllDepartmentsAPI(),
        api.get('/users/managers'),
      ]);
      setUsers(usersRes.data.data || []);
      setPagination(usersRes.data.pagination);
      setDepartments(deptsRes.data.data || []);
      setManagers(mgrsRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search, roleFilter]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditUser(null); setModal('create'); };
  const openEdit   = (u) => {
    setForm({
      ...EMPTY_FORM,
      employeeId:   u.employeeId   || '',
      firstName:    u.firstName    || '',
      lastName:     u.lastName     || '',
      email:        u.email        || '',
      role:         u.role         || 'employee',
      designation:  u.designation  || '',
      // departmentId and managerId may be populated objects
      departmentId: getId(u.departmentId) || '',
      managerId:    getId(u.managerId)    || '',
      password: '',
    });
    setEditUser(u);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.firstName || !form.lastName || !form.email) {
      return toast.error('Please fill all required fields');
    }
    if (modal === 'create' && !form.password) return toast.error('Password is required');

    setSaving(true);
    try {
      if (modal === 'create') {
        await createUserAPI(form);
        toast.success('User created successfully');
      } else {
        await updateUserAPI(getId(editUser) || editUser._id, form);
        toast.success('User updated successfully');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.firstName} ${u.lastName}?`)) return;
    try {
      await deactivateUserAPI(getId(u) || u._id);
      toast.success('User deactivated');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <Layout title="User Management" subtitle="Manage employees, managers, and admins">
      <div className="space-y-5">

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input-field pl-9 text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="input-field text-sm w-32"
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button icon={PlusIcon} onClick={openCreate}>Add User</Button>
        </div>

        {/* ── Table ── */}
        <Card padding={false}>
          {loading ? (
            <LoadingSpinner />
          ) : users.length === 0 ? (
            <EmptyState icon={MagnifyingGlassIcon} title="No users found" description="Try adjusting your search" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/30">
                    <tr>
                      {['Employee', 'ID', 'Role', 'Department', 'Manager', 'Status', 'Last Login', 'Actions'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const uid  = getId(u) || u._id;
                      // departmentId and managerId may be populated objects
                      const dept = typeof u.departmentId === 'object' ? u.departmentId : null;
                      const mgr  = typeof u.managerId    === 'object' ? u.managerId    : null;

                      return (
                        <tr key={uid} className="border-t border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                                {getInitials(u.firstName, u.lastName)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{u.firstName} {u.lastName}</p>
                                <p className="text-gray-400 text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">{u.employeeId}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                              u.role === 'admin'    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              u.role === 'manager'  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                            {dept?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                            {mgr ? `${mgr.firstName} ${mgr.lastName}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400">
                            {u.lastLogin ? formatDate(u.lastLogin) : 'Never'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button size="xs" variant="ghost" icon={PencilIcon} onClick={() => openEdit(u)} />
                              {u.isActive && (
                                <Button
                                  size="xs" variant="ghost" icon={UserMinusIcon}
                                  onClick={() => handleDeactivate(u)}
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Showing {users.length} of {pagination.total}</p>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button size="xs" variant="outline" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add New User' : 'Edit User'}
        size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {modal === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Employee ID" required value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP009" />
          <Select label="Role" required value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'manager',  label: 'Manager' },
              { value: 'admin',    label: 'Admin' },
            ]} />
          <Input label="First Name" required value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last Name" required value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Email" required type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {modal === 'create' && (
            <Input label="Password" required type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helper="Min 8 characters" />
          )}
          <Input label="Designation" value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <Select label="Department" value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            options={departments.map((d) => ({ value: getId(d) || d._id, label: d.name }))}
            placeholder="Select department" />
          <Select label="Manager" value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            options={managers.map((m) => ({ value: getId(m) || m._id, label: `${m.firstName} ${m.lastName}` }))}
            placeholder="Select manager" />
        </div>
      </Modal>
    </Layout>
  );
};

export default UsersPage;

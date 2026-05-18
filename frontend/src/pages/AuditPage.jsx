import { useEffect, useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getAuditLogsAPI } from '../api/adminAPI';
import { formatDate, getInitials } from '../utils/helpers';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ entityType: '', action: '', startDate: '', endDate: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const { data } = await getAuditLogsAPI(params);
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filters]);

  const ACTION_COLORS = {
    created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    returned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    deactivated: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <Layout title="Audit Logs" subtitle="Immutable record of all system changes">
      <div className="space-y-5">
        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-3">
            <select value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} className="input-field text-sm w-36">
              <option value="">All Entities</option>
              <option value="goal">Goal</option>
              <option value="achievement">Achievement</option>
              <option value="user">User</option>
              <option value="cycle">Cycle</option>
            </select>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="input-field text-sm w-36">
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="approved">Approved</option>
              <option value="returned">Returned</option>
              <option value="deleted">Deleted</option>
              <option value="submitted">Submitted</option>
            </select>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="input-field text-sm w-40" />
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="input-field text-sm w-40" />
            <Button variant="secondary" size="sm" onClick={() => setFilters({ entityType: '', action: '', startDate: '', endDate: '' })}>
              Clear
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card padding={false}>
          {loading ? <LoadingSpinner /> : logs.length === 0 ? (
            <EmptyState icon={ShieldCheckIcon} title="No audit logs found" description="Try adjusting your filters" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/30">
                    <tr>
                      {['Timestamp', 'Performed By', 'Role', 'Entity', 'Action', 'Description', 'IP'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                        <td className="py-2.5 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(log.createdAt, 'MMM dd, HH:mm')}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold">
                              {getInitials(log.performer?.firstName, log.performer?.lastName)}
                            </div>
                            <span className="text-xs text-gray-900 dark:text-gray-100">
                              {log.performer?.firstName} {log.performer?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{log.performedByRole}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{log.entityType}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {log.description || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-gray-400">{log.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Showing {logs.length} of {pagination.total}</p>
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
    </Layout>
  );
};

export default AuditPage;

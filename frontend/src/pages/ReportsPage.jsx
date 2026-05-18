import { useEffect, useState } from 'react';
import { DocumentArrowDownIcon, TableCellsIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { downloadCSVReportAPI, downloadExcelReportAPI, getAnalyticsDashboardAPI, downloadFile } from '../api/reportAPI';
import { getGoalCyclesAPI } from '../api/adminAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { getId } from '../utils/helpers';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState('');

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
    if (!selectedCycle) return;
    setLoading(true);
    getAnalyticsDashboardAPI({ cycleId: selectedCycle })
      .then(({ data }) => setAnalytics(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCycle]);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const params = selectedCycle ? { cycleId: selectedCycle } : {};
      if (type === 'csv') {
        const { data } = await downloadCSVReportAPI(params);
        downloadFile(data, `goalsync-report-${Date.now()}.csv`);
      } else {
        const { data } = await downloadExcelReportAPI(params);
        downloadFile(data, `goalsync-report-${Date.now()}.xlsx`);
      }
      toast.success(`${type.toUpperCase()} report downloaded`);
    } catch (e) {
      toast.error('Download failed');
    } finally { setDownloading(''); }
  };

  const quarterlyData = analytics?.quarterlyTrend?.map((q) => ({
    quarter: q.quarter,
    avgProgress: parseFloat(parseFloat(q.avgProgress || 0).toFixed(1)),
    count: parseInt(q.count),
  })) || [];

  const statusData = analytics?.statusBreakdown?.map((s) => ({
    status: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    count: parseInt(s.count),
  })) || [];

  return (
    <Layout title="Reports & Analytics" subtitle="Download reports and view performance analytics">
      <div className="space-y-6">
        {/* Download section */}
        <Card>
          <CardHeader title="Download Reports" subtitle="Export goal data in your preferred format" icon={DocumentArrowDownIcon} />
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Goal Cycle</label>
              <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="input-field text-sm w-48">
                <option value="">All Cycles</option>
                {cycles.map((c) => <option key={getId(c) || c._id} value={getId(c) || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                icon={TableCellsIcon}
                loading={downloading === 'csv'}
                onClick={() => handleDownload('csv')}
              >
                Download CSV
              </Button>
              <Button
                icon={DocumentArrowDownIcon}
                loading={downloading === 'excel'}
                onClick={() => handleDownload('excel')}
              >
                Download Excel
              </Button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400">
            Reports include: Employee Name, Goal Title, Thrust Area, UoM, Target, Weightage, Status, Q1–Q4 Achievements & Progress %
          </div>
        </Card>

        {/* Analytics */}
        {loading ? <LoadingSpinner /> : analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quarterly trend */}
            <Card>
              <CardHeader title="Quarterly Progress Trend" subtitle="Average progress across quarters" />
              {quarterlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Avg Progress']} />
                    <Line type="monotone" dataKey="avgProgress" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>}
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader title="Goal Status Breakdown" subtitle="Distribution by status" />
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>}
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;

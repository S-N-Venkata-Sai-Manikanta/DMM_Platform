import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users as UsersIcon, ShieldCheck, Crown, User as UserIcon, FileText, FileImage,
  Layers, CheckCircle2, Clock, Send, Activity, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { userApi, dashboardApi } from '../api/endpoints.js';
import { useAuthStore } from '../store/authStore.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Card, Avatar, Skeleton, EmptyState } from '../components/ui/primitives.jsx';
import { formatNumber, timeAgo } from '../lib/utils.js';

const ACTIVITY_LABEL = {
  TEMPLATE_UPLOAD: 'uploaded a template', ASSET_UPLOAD: 'uploaded an asset',
  APPROVAL_SUBMISSION: 'submitted a request', APPROVAL_APPROVED: 'approved content',
  APPROVAL_REJECTED: 'rejected content', APPROVAL_RESUBMITTED: 'resubmitted content',
  POST_COMPLETION: 'marked content posted', USER_CREATED: 'created a user',
  USER_UPDATED: 'updated a user', USER_DEACTIVATED: 'deactivated a user',
  ANALYTICS_UPDATED: 'updated analytics',
};

export default function Overview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: usersData, isLoading: lu } = useQuery({ queryKey: ['users', 'overview'], queryFn: () => userApi.list() });
  const { data: statsData } = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });
  const { data: activityData } = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: dashboardApi.activity });

  const users = usersData?.users || [];
  const counts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const stats = statsData?.stats || {};
  const activity = activityData?.activity || [];

  const userCards = [
    { label: 'Total Users', value: users.length, icon: UsersIcon, tone: 'text-brand-600 bg-brand-50 dark:bg-brand-500/10' },
    { label: 'Admins', value: counts.ADMIN || 0, icon: ShieldCheck, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10' },
    { label: 'CEOs', value: counts.CEO || 0, icon: Crown, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Users', value: counts.USER || 0, icon: UserIcon, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10' },
  ];
  const platformCards = [
    { label: 'Approval Requests', value: stats.totalRequests, icon: FileText, tone: 'text-brand-600 bg-brand-50 dark:bg-brand-500/10' },
    { label: 'Pending', value: stats.pending, icon: Clock, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Posted', value: stats.posted, icon: Send, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10' },
    { label: 'Templates', value: stats.totalTemplates, icon: FileImage, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10' },
    { label: 'Assets', value: stats.totalAssets, icon: Layers, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]} 👋`} subtitle="System overview and administration shortcuts." />

      {/* Users */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Accounts</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {lu ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : userCards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card p-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-slate-400">{c.label}</p><p className="mt-1 text-3xl font-extrabold text-slate-800 dark:text-white">{c.value}</p></div>
                  <div className={`rounded-xl p-2.5 ${c.tone}`}><c.icon className="h-5 w-5" /></div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Platform stats */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Platform Activity</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {platformCards.map((c) => (
            <div key={c.label} className="card p-4">
              <div className={`mb-2 w-fit rounded-lg p-2 ${c.tone}`}><c.icon className="h-4 w-4" /></div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{formatNumber(c.value ?? 0)}</p>
              <p className="text-xs text-slate-400">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions + recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-white">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction icon={UsersIcon} label="Manage users" onClick={() => navigate('/users')} />
            <QuickAction icon={Activity} label="Update social analytics" onClick={() => navigate('/analytics')} />
            <QuickAction icon={FileText} label="View activity logs" onClick={() => navigate('/activity')} />
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-bold text-slate-800 dark:text-white">Recent Activity</h3>
          {activity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Platform actions will appear here." />
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 8).map((log) => (
                <div key={log._id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <Avatar src={log.user?.avatar} name={log.user?.name} size="sm" />
                  <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{log.user?.name}</span> {ACTIVITY_LABEL[log.action] || 'did something'}
                  </p>
                  <span className="text-[11px] text-slate-400">{timeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-500/5">
    <Icon className="h-4 w-4 text-brand-600" /> {label}
    <ArrowRight className="ml-auto h-4 w-4 text-slate-300" />
  </button>
);

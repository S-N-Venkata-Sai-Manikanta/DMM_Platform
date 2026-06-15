import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Linkedin, Instagram, Youtube, Facebook, Save } from 'lucide-react';
import { analyticsApi } from '../api/endpoints.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, Input, Skeleton } from '../components/ui/primitives.jsx';
import { formatDateTime } from '../lib/utils.js';

const PLATFORM_META = {
  LinkedIn: { icon: Linkedin, color: '#0A66C2' },
  Instagram: { icon: Instagram, color: '#E1306C' },
  YouTube: { icon: Youtube, color: '#FF0000' },
  Facebook: { icon: Facebook, color: '#1877F2' },
};

const FIELD_LABELS = {
  profilesManaged: 'Profiles Managed', followers: 'Followers', impressions: 'Impressions',
  reach: 'Reach', engagementRate: 'Engagement Rate (%)', subscribers: 'Subscribers',
  views: 'Views', watchHours: 'Watch Hours',
};

export default function Analytics() {
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: analyticsApi.get });

  return (
    <div>
      <PageHeader title="Social Media Analytics" subtitle="Enter and update the latest metrics for each platform. These power the product dashboard." />
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.keys(PLATFORM_META).map((platform) => (
            <PlatformCard key={platform} platform={platform} fields={data?.fields?.[platform] || []} latest={data?.latest?.[platform]} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformCard({ platform, fields, latest }) {
  const qc = useQueryClient();
  const { icon: Icon, color } = PLATFORM_META[platform];
  const [values, setValues] = useState({});

  useEffect(() => {
    const init = {};
    fields.forEach((f) => { init[f] = latest?.[f] ?? ''; });
    setValues(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  const saveMut = useMutation({
    mutationFn: () => analyticsApi.record({ platform, ...values }),
    onSuccess: () => { toast.success(`${platform} metrics saved`); qc.invalidateQueries({ queryKey: ['analytics'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}><Icon className="h-5 w-5" style={{ color }} /></div>
          <span className="font-bold text-slate-700 dark:text-slate-200">{platform}</span>
        </div>
        {latest && <span className="text-xs text-slate-400">Updated {formatDateTime(latest.date)}</span>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <Input key={f} label={FIELD_LABELS[f] || f} type="number" min="0" step={f === 'engagementRate' ? '0.1' : '1'}
              value={values[f] ?? ''} onChange={(e) => setValues({ ...values, [f]: e.target.value })} placeholder="0" />
          ))}
        </div>
        <Button type="submit" loading={saveMut.isPending} className="w-full"><Save className="h-4 w-4" /> Save {platform} metrics</Button>
      </form>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Users, Mail, TrendingUp, BarChart2, Clock } from 'lucide-react';

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    emailsSent: 0,
    openRate: 0,
    replyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [campaignsRes, leadsRes, logsRes] = await Promise.all([
        supabase.from('campaigns').select('status'),
        supabase.from('leads').select('id'),
        supabase.from('email_logs').select('opened_at, replied_at'),
      ]);

      const campaigns = campaignsRes.data || [];
      const leads = leadsRes.data || [];
      const logs = logsRes.data || [];

      const opened = logs.filter((l) => l.opened_at).length;
      const replied = logs.filter((l) => l.replied_at).length;

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
        totalLeads: leads.length,
        emailsSent: logs.length,
        openRate: logs.length > 0 ? (opened / logs.length) * 100 : 0,
        replyRate: logs.length > 0 ? (replied / logs.length) * 100 : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns,
      total: stats.totalCampaigns,
      icon: Send,
      color: 'blue',
    },
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'green',
    },
    {
      label: 'Emails Sent',
      value: stats.emailsSent,
      icon: Mail,
      color: 'purple',
    },
    {
      label: 'Open Rate',
      value: `${stats.openRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'orange',
    },
    {
      label: 'Reply Rate',
      value: `${stats.replyRate.toFixed(1)}%`,
      icon: BarChart2,
      color: 'pink',
    },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-neutral-200 rounded-lg w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold text-neutral-900 mb-2 tracking-tight">Dashboard</h1>
        <p className="text-neutral-500 text-base">Overview of your email outreach performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = {
            blue: 'bg-blue-50 text-blue-500',
            green: 'bg-green-50 text-green-500',
            purple: 'bg-violet-50 text-violet-500',
            orange: 'bg-amber-50 text-amber-500',
            pink: 'bg-pink-50 text-pink-500',
          };

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    colors[card.color as keyof typeof colors]
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-semibold text-neutral-900 mb-1 tracking-tight">
                {card.value}
                {card.total !== undefined && (
                  <span className="text-lg text-neutral-400 ml-1 font-normal">/ {card.total}</span>
                )}
              </div>
              <div className="text-sm text-neutral-500 font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-neutral-600" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            <p className="text-neutral-400 text-center py-12 text-sm">No recent activity</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Performance Trends</h2>
          </div>
          <div className="space-y-4">
            <p className="text-neutral-400 text-center py-12 text-sm">
              Start sending emails to see performance trends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Mail, MousePointer, Reply, XCircle, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    bounced: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('email_logs')
        .select('opened_at, clicked_at, replied_at, bounced_at');

      if (error) throw error;

      const sent = logs?.length || 0;
      const opened = logs?.filter((l) => l.opened_at).length || 0;
      const clicked = logs?.filter((l) => l.clicked_at).length || 0;
      const replied = logs?.filter((l) => l.replied_at).length || 0;
      const bounced = logs?.filter((l) => l.bounced_at).length || 0;

      setAnalytics({
        sent,
        opened,
        clicked,
        replied,
        bounced,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        replyRate: sent > 0 ? (replied / sent) * 100 : 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Emails Sent',
      value: analytics.sent,
      icon: Mail,
      color: 'blue',
    },
    {
      label: 'Opened',
      value: analytics.opened,
      rate: analytics.openRate,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Clicked',
      value: analytics.clicked,
      rate: analytics.clickRate,
      icon: MousePointer,
      color: 'purple',
    },
    {
      label: 'Replied',
      value: analytics.replied,
      rate: analytics.replyRate,
      icon: Reply,
      color: 'orange',
    },
    {
      label: 'Bounced',
      value: analytics.bounced,
      icon: XCircle,
      color: 'red',
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Track your email campaign performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = {
            blue: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            green: 'bg-green-500/10 text-green-400 border-green-500/20',
            purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            red: 'bg-red-500/10 text-red-400 border-red-500/20',
          };

          return (
            <div
              key={index}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                    colors[card.color as keyof typeof colors]
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {card.value.toLocaleString()}
                {card.rate !== undefined && (
                  <span className="text-lg text-gray-400 ml-2">
                    {card.rate.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Performance Overview</h2>
          </div>
          <div className="space-y-4">
            {analytics.sent > 0 ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Open Rate</span>
                    <span className="text-white font-medium">
                      {analytics.openRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(analytics.openRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Click Rate</span>
                    <span className="text-white font-medium">
                      {analytics.clickRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(analytics.clickRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Reply Rate</span>
                    <span className="text-white font-medium">
                      {analytics.replyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(analytics.replyRate, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No data yet. Start sending emails to see analytics.
              </p>
            )}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Campaign Health</h2>
          </div>
          <div className="space-y-4">
            {analytics.sent > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Engagement</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      analytics.openRate > 20
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : analytics.openRate > 10
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {analytics.openRate > 20
                      ? 'Excellent'
                      : analytics.openRate > 10
                      ? 'Good'
                      : 'Needs Improvement'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Deliverability</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (analytics.bounced / analytics.sent) * 100 < 2
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : (analytics.bounced / analytics.sent) * 100 < 5
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {(analytics.bounced / analytics.sent) * 100 < 2
                      ? 'Excellent'
                      : (analytics.bounced / analytics.sent) * 100 < 5
                      ? 'Good'
                      : 'Poor'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Response Rate</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      analytics.replyRate > 5
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : analytics.replyRate > 2
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {analytics.replyRate > 5
                      ? 'Excellent'
                      : analytics.replyRate > 2
                      ? 'Good'
                      : 'Low'}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Campaign health metrics will appear here
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

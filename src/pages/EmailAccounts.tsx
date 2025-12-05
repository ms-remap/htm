import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, CheckCircle, AlertCircle, Trash2, X, Activity } from 'lucide-react';

interface EmailAccount {
  id: string;
  email: string;
  name: string;
  smtp_host: string;
  smtp_port: number;
  daily_limit: number;
  warmup_enabled: boolean;
  warmup_daily_increase: number;
  status: string;
  health_score: number;
  created_at: string;
}

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading email accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email account?')) return;

    try {
      const { error } = await supabase.from('email_accounts').delete().eq('id', id);
      if (error) throw error;
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const toggleWarmup = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('email_accounts')
        .update({ warmup_enabled: !currentState })
        .eq('id', id);

      if (error) throw error;
      loadAccounts();
    } catch (error) {
      console.error('Error updating warmup:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800 rounded w-48" />
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-neutral-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Accounts</h1>
          <p className="text-gray-400">Manage sending accounts and warmup settings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No email accounts</h3>
          <p className="text-gray-400 mb-6">
            Add an email account to start sending campaigns
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Email Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{account.name}</h3>
                      <p className="text-sm text-gray-400">{account.email}</p>
                    </div>
                    {account.status === 'active' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Daily Limit</div>
                      <div className="text-lg font-bold text-white">
                        {account.daily_limit}
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Health Score</div>
                      <div className="text-lg font-bold text-white">
                        {account.health_score}%
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">SMTP</div>
                      <div className="text-sm font-medium text-white">
                        {account.smtp_host}:{account.smtp_port}
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Warmup</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleWarmup(account.id, account.warmup_enabled)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            account.warmup_enabled
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-neutral-700 text-gray-400'
                          }`}
                        >
                          {account.warmup_enabled ? 'On' : 'Off'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {account.warmup_enabled && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm text-orange-300">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>
                          Warmup active: Increasing by {account.warmup_daily_increase}{' '}
                          emails per day
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteAccount(account.id)}
                  className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddAccountModal onClose={() => setShowAddModal(false)} onSuccess={loadAccounts} />
      )}
    </div>
  );
}

function AddAccountModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    imap_host: '',
    imap_port: 993,
    daily_limit: 50,
    warmup_enabled: true,
    warmup_daily_increase: 5,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to add an email account');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('email_accounts').insert([
        {
          ...formData,
          user_id: user.id,
        }
      ]);

      if (error) {
        console.error('Database error:', error);
        alert(`Failed to add email account: ${error.message}`);
        setSaving(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding account:', error);
      alert(`Failed to add email account: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 border border-neutral-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Email Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              placeholder="My Gmail Account"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SMTP Host *
              </label>
              <input
                type="text"
                required
                value={formData.smtp_host}
                onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SMTP Port *
              </label>
              <input
                type="number"
                required
                value={formData.smtp_port}
                onChange={(e) =>
                  setFormData({ ...formData, smtp_port: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SMTP Username *
            </label>
            <input
              type="text"
              required
              value={formData.smtp_username}
              onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SMTP Password *
            </label>
            <input
              type="password"
              required
              value={formData.smtp_password}
              onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IMAP Host *
              </label>
              <input
                type="text"
                required
                value={formData.imap_host}
                onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="imap.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IMAP Port *
              </label>
              <input
                type="number"
                required
                value={formData.imap_port}
                onChange={(e) =>
                  setFormData({ ...formData, imap_port: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Email Limit
            </label>
            <input
              type="number"
              value={formData.daily_limit}
              onChange={(e) =>
                setFormData({ ...formData, daily_limit: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.warmup_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, warmup_enabled: e.target.checked })
                }
                className="w-5 h-5 bg-neutral-800 border-neutral-700 rounded"
              />
              <label className="text-sm font-medium text-white">Enable Email Warmup</label>
            </div>
            {formData.warmup_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Daily Increase
                </label>
                <input
                  type="number"
                  value={formData.warmup_daily_increase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warmup_daily_increase: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Gradually increase sending volume to build sender reputation
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Webhook as WebhookIcon, Trash2, X, Info } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  authentication_type: string;
  authentication_value: string | null;
  field_mappings: Record<string, string>;
  created_at: string;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const { error } = await supabase.from('webhooks').delete().eq('id', id);
      if (error) throw error;
      loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800 rounded w-48" />
          <div className="h-32 bg-neutral-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Webhooks</h1>
          <p className="text-gray-400">
            Configure webhooks for dynamic email content injection
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Webhook
        </button>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-orange-300">
          <p className="font-medium mb-1">How Webhooks Work</p>
          <p>
            Webhooks fetch dynamic content before sending each email. The webhook URL will
            receive lead data and should return JSON with custom fields. Use placeholders like{' '}
            {'{'}
            {'{'}webhookData.fieldName{'}}'}
            in your email templates.
          </p>
        </div>
      </div>

      {webhooks.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <WebhookIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No webhooks configured</h3>
          <p className="text-gray-400 mb-6">
            Add a webhook to dynamically inject content into your emails
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <WebhookIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{webhook.name}</h3>
                      <p className="text-sm text-gray-400 font-mono">{webhook.url}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Method</div>
                      <div className="text-sm font-bold text-white">{webhook.method}</div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Authentication</div>
                      <div className="text-sm font-bold text-white">
                        {webhook.authentication_type}
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Custom Headers</div>
                      <div className="text-sm font-bold text-white">
                        {Object.keys(webhook.headers).length}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteWebhook(webhook.id)}
                  className="ml-4 p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddWebhookModal onClose={() => setShowAddModal(false)} onSuccess={loadWebhooks} />
      )}
    </div>
  );
}

function AddWebhookModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: {} as Record<string, string>,
    authentication_type: 'none',
    authentication_value: '',
  });
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [saving, setSaving] = useState(false);

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData({
        ...formData,
        headers: { ...formData.headers, [headerKey]: headerValue },
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to add a webhook');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('webhooks').insert([
        {
          ...formData,
          user_id: user.id,
          authentication_value: formData.authentication_value || null,
          field_mappings: {},
        },
      ]);

      if (error) {
        console.error('Database error:', error);
        alert(`Failed to add webhook: ${error.message}`);
        setSaving(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding webhook:', error);
      alert(`Failed to add webhook: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 border border-neutral-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Webhook</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Webhook Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              placeholder="Content API"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Webhook URL *
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              placeholder="https://api.example.com/content"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use variables: {'{'}
              {'{'}email{'}'}
              {'}'}, {'{'}
              {'{'}firstName{'}'}
              {'}'}, {'{'}
              {'{'}lastName{'}'}
              {'}'}, {'{'}
              {'{'}company{'}}'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Authentication Type
            </label>
            <select
              value={formData.authentication_type}
              onChange={(e) =>
                setFormData({ ...formData, authentication_type: e.target.value })
              }
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
            </select>
          </div>
          {formData.authentication_type !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Authentication Value
              </label>
              <input
                type="text"
                value={formData.authentication_value}
                onChange={(e) =>
                  setFormData({ ...formData, authentication_value: e.target.value })
                }
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder={
                  formData.authentication_type === 'bearer' ? 'Token' : 'API Key'
                }
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Headers
            </label>
            <div className="space-y-2 mb-2">
              {Object.entries(formData.headers).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-neutral-800 rounded-lg p-2"
                >
                  <span className="text-sm text-white flex-1">
                    {key}: {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHeader(key)}
                    className="text-orange-500 hover:text-orange-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
                className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="Header name"
              />
              <input
                type="text"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
                className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                placeholder="Header value"
              />
              <button
                type="button"
                onClick={addHeader}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
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
              {saving ? 'Adding...' : 'Add Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

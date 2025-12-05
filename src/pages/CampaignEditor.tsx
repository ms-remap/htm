import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  Webhook as WebhookIcon,
  Info,
  Image,
  Paperclip,
  X,
  Send,
} from 'lucide-react';
import VariablePicker from '../components/VariablePicker';

interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
}

interface Sequence {
  id?: string;
  name: string;
  step_number: number;
  delay_days: number;
  delay_hours: number;
  delay_minutes: number;
  subject_variants: string[];
  body_variants: string[];
  attachments: Attachment[];
  presend_webhook_enabled: boolean;
  presend_webhook_url: string;
  presend_webhook_method: string;
  presend_webhook_headers: Record<string, string>;
  content_webhook_enabled: boolean;
  content_webhook_url: string;
  content_webhook_method: string;
  content_webhook_headers: Record<string, string>;
  content_webhook_subject_field: string;
  content_webhook_body_field: string;
}

interface CampaignEditorProps {
  onNavigate: (page: string) => void;
  campaignId?: string;
}

export default function CampaignEditor({ onNavigate, campaignId }: CampaignEditorProps) {
  const [campaignName, setCampaignName] = useState('');
  const [selectedEmailAccounts, setSelectedEmailAccounts] = useState<string[]>([]);
  const [availableEmailAccounts, setAvailableEmailAccounts] = useState<any[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([
    {
      name: 'Initial Email',
      step_number: 1,
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      subject_variants: [''],
      body_variants: [''],
      attachments: [],
      presend_webhook_enabled: false,
      presend_webhook_url: '',
      presend_webhook_method: 'POST',
      presend_webhook_headers: {},
      content_webhook_enabled: false,
      content_webhook_url: '',
      content_webhook_method: 'POST',
      content_webhook_headers: {},
      content_webhook_subject_field: 'subject',
      content_webhook_body_field: 'body',
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingSequence, setTestingSequence] = useState<number | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    loadEmailAccounts();
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadEmailAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('status', 'active')
        .order('email');

      if (error) throw error;
      setAvailableEmailAccounts(data || []);
    } catch (error) {
      console.error('Error loading email accounts:', error);
    }
  };

  const loadCampaign = async () => {
    if (!campaignId) return;

    try {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        setCampaignName(campaign.name);
        setSelectedEmailAccounts(campaign.email_account_ids || []);

        const { data: seqs } = await supabase
          .from('sequences')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('step_number');

        if (seqs && seqs.length > 0) {
          setSequences(
            seqs.map((s) => ({
              id: s.id,
              name: s.name,
              step_number: s.step_number,
              delay_days: s.delay_days || 0,
              delay_hours: s.delay_hours || 0,
              delay_minutes: s.delay_minutes || 0,
              subject_variants: s.subject_variants,
              body_variants: s.body_variants,
              presend_webhook_enabled: s.presend_webhook_enabled || false,
              presend_webhook_url: s.presend_webhook_url || '',
              presend_webhook_method: s.presend_webhook_method || 'POST',
              presend_webhook_headers: s.presend_webhook_headers || {},
              attachments: s.attachments || [],
              content_webhook_enabled: s.content_webhook_enabled || false,
              content_webhook_url: s.content_webhook_url || '',
              content_webhook_method: s.content_webhook_method || 'POST',
              content_webhook_headers: s.content_webhook_headers || {},
              content_webhook_subject_field: s.content_webhook_subject_field || 'subject',
              content_webhook_body_field: s.content_webhook_body_field || 'body',
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
    }
  };

  const saveCampaign = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    setSaving(true);

    try {
      let finalCampaignId = campaignId;

      if (!campaignId) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          alert('You must be logged in to create a campaign');
          setSaving(false);
          return;
        }

        const { data: newCampaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            user_id: user.id,
            name: campaignName,
            status: 'draft',
            email_account_ids: selectedEmailAccounts,
          })
          .select()
          .single();

        if (campaignError) {
          console.error('Campaign insert error:', campaignError);
          alert(`Failed to create campaign: ${campaignError.message}`);
          setSaving(false);
          return;
        }
        finalCampaignId = newCampaign.id;
      } else {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({
            name: campaignName,
            email_account_ids: selectedEmailAccounts,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);

        if (updateError) {
          console.error('Campaign update error:', updateError);
          alert(`Failed to update campaign: ${updateError.message}`);
          setSaving(false);
          return;
        }
      }

      if (campaignId) {
        const { error: deleteError } = await supabase
          .from('sequences')
          .delete()
          .eq('campaign_id', campaignId);

        if (deleteError) {
          console.error('Sequences delete error:', deleteError);
        }
      }

      const sequencesToInsert = sequences.map((seq, index) => ({
        campaign_id: finalCampaignId,
        name: seq.name,
        step_number: index + 1,
        delay_days: seq.delay_days || 0,
        delay_hours: seq.delay_hours || 0,
        delay_minutes: seq.delay_minutes || 0,
        subject_variants: seq.subject_variants,
        body_variants: seq.body_variants,
        attachments: seq.attachments || [],
        presend_webhook_enabled: seq.presend_webhook_enabled,
        presend_webhook_url: seq.presend_webhook_url || null,
        presend_webhook_method: seq.presend_webhook_method,
        presend_webhook_headers: seq.presend_webhook_headers,
        content_webhook_enabled: seq.content_webhook_enabled,
        content_webhook_url: seq.content_webhook_url || null,
        content_webhook_method: seq.content_webhook_method,
        content_webhook_headers: seq.content_webhook_headers,
        content_webhook_subject_field: seq.content_webhook_subject_field || 'subject',
        content_webhook_body_field: seq.content_webhook_body_field || 'body',
      }));

      const { error: seqError } = await supabase
        .from('sequences')
        .insert(sequencesToInsert);

      if (seqError) {
        console.error('Sequences insert error:', seqError);
        alert(`Failed to save sequences: ${seqError.message}`);
        setSaving(false);
        return;
      }

      alert('Campaign saved successfully!');
      onNavigate('campaigns');
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      alert(`Failed to save campaign: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (testingSequence === null) return;

    setSendingTest(true);
    try {
      const sequence = sequences[testingSequence];
      const subject = sequence.subject_variants[0] || 'Test Email';
      const body = sequence.body_variants[0] || 'Test email body';

      const testLeadData = {
        email: testEmailAddress,
        first_name: 'Test',
        last_name: 'User',
        company: 'Test Company',
        title: 'Test Title',
        phone: '+1234567890',
        website: 'https://example.com',
        linkedin_url: 'https://linkedin.com/in/test',
        custom_fields: {},
      };

      let finalSubject = subject;
      let finalBody = body;

      if (sequence.content_webhook_enabled && sequence.content_webhook_url) {
        try {
          const webhookOptions: RequestInit = {
            method: sequence.content_webhook_method,
            headers: {
              'Content-Type': 'application/json',
              ...sequence.content_webhook_headers,
            },
          };

          if (sequence.content_webhook_method === 'POST') {
            webhookOptions.body = JSON.stringify(testLeadData);
          }

          const webhookUrl = sequence.content_webhook_method === 'GET'
            ? `${sequence.content_webhook_url}?${new URLSearchParams(testLeadData as any).toString()}`
            : sequence.content_webhook_url;

          const webhookResponse = await fetch(webhookUrl, webhookOptions);

          if (webhookResponse.ok) {
            let webhookData = await webhookResponse.json();
            console.log('Raw webhook response:', webhookData);

            if (Array.isArray(webhookData) && webhookData.length > 0) {
              webhookData = webhookData[0];
            }

            if (webhookData.output) {
              webhookData = webhookData.output;
            }

            console.log('Processed webhook data:', webhookData);
            finalSubject = webhookData[sequence.content_webhook_subject_field] || finalSubject;
            finalBody = webhookData[sequence.content_webhook_body_field] || finalBody;
          }
        } catch (error) {
          console.error('Content webhook error:', error);
        }
      }

      const replaceVariables = (text: string, data: any) => {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return data[key] || match;
        });
      };

      finalSubject = replaceVariables(finalSubject, testLeadData);
      finalBody = replaceVariables(finalBody, testLeadData);

      if (selectedEmailAccounts.length === 0) {
        alert('Please select at least one email account in campaign settings');
        setSendingTest(false);
        return;
      }

      const { data: emailAccount } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', selectedEmailAccounts[0])
        .single();

      if (!emailAccount) {
        alert('Email account not found. Please check campaign settings.');
        setSendingTest(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error('API URL not configured. Please check your .env file.');
      }

      const payload = {
        to: testEmailAddress,
        subject: finalSubject,
        body: finalBody,
        from_name: emailAccount.name,
        from_email: emailAccount.email,
        smtp_config: {
          host: emailAccount.smtp_host,
          port: emailAccount.smtp_port,
          username: emailAccount.smtp_username,
          password: emailAccount.smtp_password,
        },
      };

      console.log('Sending test email:', {
        to: payload.to,
        subject: payload.subject,
        from: `${payload.from_name} <${payload.from_email}>`,
      });

      const response = await fetch(`${apiUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      const result = await response.json();
      alert(`Test email sent successfully to ${testEmailAddress}!`);
      setTestEmailModalOpen(false);
      setTestEmailAddress('');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      alert(`Failed to send test email: ${error.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const addSequence = () => {
    setSequences([
      ...sequences,
      {
        name: `Follow-up ${sequences.length}`,
        step_number: sequences.length + 1,
        delay_days: 3,
        delay_hours: 0,
        delay_minutes: 0,
        subject_variants: [''],
        body_variants: [''],
        attachments: [],
        presend_webhook_enabled: false,
        presend_webhook_url: '',
        presend_webhook_method: 'POST',
        presend_webhook_headers: {},
        content_webhook_enabled: false,
        content_webhook_url: '',
        content_webhook_method: 'POST',
        content_webhook_headers: {},
        content_webhook_subject_field: 'subject',
        content_webhook_body_field: 'body',
      },
    ]);
  };

  const updateSequence = (index: number, updates: Partial<Sequence>) => {
    const newSequences = [...sequences];
    newSequences[index] = { ...newSequences[index], ...updates };
    setSequences(newSequences);
  };

  const removeSequence = (index: number) => {
    if (sequences.length === 1) {
      alert('Campaign must have at least one sequence');
      return;
    }
    setSequences(sequences.filter((_, i) => i !== index));
  };

  const addVariant = (seqIndex: number, type: 'subject' | 'body') => {
    const seq = sequences[seqIndex];
    if (type === 'subject') {
      updateSequence(seqIndex, { subject_variants: [...seq.subject_variants, ''] });
    } else {
      updateSequence(seqIndex, { body_variants: [...seq.body_variants, ''] });
    }
  };

  const updateVariant = (
    seqIndex: number,
    type: 'subject' | 'body',
    variantIndex: number,
    value: string
  ) => {
    const seq = sequences[seqIndex];
    if (type === 'subject') {
      const newVariants = [...seq.subject_variants];
      newVariants[variantIndex] = value;
      updateSequence(seqIndex, { subject_variants: newVariants });
    } else {
      const newVariants = [...seq.body_variants];
      newVariants[variantIndex] = value;
      updateSequence(seqIndex, { body_variants: newVariants });
    }
  };

  const removeVariant = (seqIndex: number, type: 'subject' | 'body', variantIndex: number) => {
    const seq = sequences[seqIndex];
    if (type === 'subject' && seq.subject_variants.length === 1) {
      alert('Must have at least one subject variant');
      return;
    }
    if (type === 'body' && seq.body_variants.length === 1) {
      alert('Must have at least one body variant');
      return;
    }

    if (type === 'subject') {
      updateSequence(seqIndex, {
        subject_variants: seq.subject_variants.filter((_, i) => i !== variantIndex),
      });
    } else {
      updateSequence(seqIndex, {
        body_variants: seq.body_variants.filter((_, i) => i !== variantIndex),
      });
    }
  };

  const addAttachment = (seqIndex: number, type: 'image' | 'file', url: string, name: string) => {
    const seq = sequences[seqIndex];
    updateSequence(seqIndex, {
      attachments: [...seq.attachments, { type, url, name }],
    });
  };

  const removeAttachment = (seqIndex: number, attachIndex: number) => {
    const seq = sequences[seqIndex];
    updateSequence(seqIndex, {
      attachments: seq.attachments.filter((_, i) => i !== attachIndex),
    });
  };

  const insertVariable = (seqIndex: number, type: 'subject' | 'body', variantIndex: number, variable: string) => {
    const seq = sequences[seqIndex];
    if (type === 'subject') {
      const currentValue = seq.subject_variants[variantIndex];
      updateVariant(seqIndex, 'subject', variantIndex, currentValue + variable);
    } else {
      const currentValue = seq.body_variants[variantIndex];
      updateVariant(seqIndex, 'body', variantIndex, currentValue + variable);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('campaigns')}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {campaignId ? 'Edit Campaign' : 'New Campaign'}
            </h1>
            <p className="text-gray-400">Configure your email sequence and settings</p>
          </div>
        </div>
        <button
          onClick={saveCampaign}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Q4 Outbound Campaign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Accounts (Rotation)
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Select email accounts to rotate through. Leads will be evenly distributed across selected accounts. Each lead's follow-ups will use the same email account.
              </p>
              {availableEmailAccounts.length === 0 ? (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-orange-300 text-sm">
                  No active email accounts found. Please add and activate email accounts first.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableEmailAccounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center gap-3 bg-neutral-800 rounded-lg p-3 cursor-pointer hover:bg-neutral-750 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmailAccounts.includes(account.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmailAccounts([...selectedEmailAccounts, account.id]);
                          } else {
                            setSelectedEmailAccounts(selectedEmailAccounts.filter(id => id !== account.id));
                          }
                        }}
                        className="w-5 h-5 rounded border-neutral-600 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{account.name}</div>
                        <div className="text-xs text-gray-400">{account.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Limit: {account.daily_limit || 0}/day
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedEmailAccounts.length > 0 && (
                <div className="mt-2 text-xs text-orange-400">
                  ✓ {selectedEmailAccounts.length} email account{selectedEmailAccounts.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {sequences.map((seq, seqIndex) => (
            <div
              key={seqIndex}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {seqIndex + 1}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={seq.name}
                      onChange={(e) => updateSequence(seqIndex, { name: e.target.value })}
                      className="text-lg font-bold bg-transparent text-white border-none focus:outline-none focus:ring-0 px-0"
                      placeholder="Sequence name"
                    />
                    {seqIndex > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                        <Clock className="w-4 h-4" />
                        <span>Wait</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={seq.delay_days}
                            onChange={(e) =>
                              updateSequence(seqIndex, {
                                delay_days: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-center"
                            min="0"
                          />
                          <span>days</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={seq.delay_hours}
                            onChange={(e) =>
                              updateSequence(seqIndex, {
                                delay_hours: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-center"
                            min="0"
                            max="23"
                          />
                          <span>hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={seq.delay_minutes}
                            onChange={(e) =>
                              updateSequence(seqIndex, {
                                delay_minutes: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-center"
                            min="0"
                            max="59"
                          />
                          <span>minutes</span>
                        </div>
                        <span>after previous step</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTestingSequence(seqIndex);
                      setTestEmailModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Test Email
                  </button>
                  {sequences.length > 1 && (
                    <button
                      onClick={() => removeSequence(seqIndex)}
                      className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Subject Lines (A/B Test Variants)
                    </label>
                  </div>
                  {seq.subject_variants.map((subject, varIndex) => (
                    <div key={varIndex} className="space-y-2 mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) =>
                            updateVariant(seqIndex, 'subject', varIndex, e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder={`Subject variant ${varIndex + 1}`}
                        />
                        {seq.subject_variants.length > 1 && (
                          <button
                            onClick={() => removeVariant(seqIndex, 'subject', varIndex)}
                            className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <VariablePicker
                        onSelect={(variable) => insertVariable(seqIndex, 'subject', varIndex, variable)}
                        showWebhookVars={seq.content_webhook_enabled}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addVariant(seqIndex, 'subject')}
                    className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add variant
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Body (A/B Test Variants)
                  </label>
                  {seq.body_variants.map((body, varIndex) => (
                    <div key={varIndex} className="space-y-2 mb-3">
                      <div className="flex gap-2">
                        <textarea
                          value={body}
                          onChange={(e) =>
                            updateVariant(seqIndex, 'body', varIndex, e.target.value)
                          }
                          rows={6}
                          className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder={`Email body variant ${varIndex + 1}\n\nUse variables for personalization`}
                        />
                        {seq.body_variants.length > 1 && (
                          <button
                            onClick={() => removeVariant(seqIndex, 'body', varIndex)}
                            className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg h-fit"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <VariablePicker
                        onSelect={(variable) => insertVariable(seqIndex, 'body', varIndex, variable)}
                        showWebhookVars={seq.content_webhook_enabled}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addVariant(seqIndex, 'body')}
                    className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add variant
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attachments
                  </label>
                  {seq.attachments.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {seq.attachments.map((attachment, attachIndex) => (
                        <div
                          key={attachIndex}
                          className="flex items-center gap-3 bg-neutral-800 rounded-lg p-3"
                        >
                          {attachment.type === 'image' ? (
                            <Image className="w-5 h-5 text-orange-400" />
                          ) : (
                            <Paperclip className="w-5 h-5 text-neutral-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{attachment.url}</div>
                          </div>
                          <button
                            onClick={() => removeAttachment(seqIndex, attachIndex)}
                            className="p-1 text-orange-500 hover:bg-orange-500/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <AttachmentInput
                    onAdd={(type, url, name) => addAttachment(seqIndex, type, url, name)}
                  />
                </div>

                <div className="border-t border-neutral-800 pt-4 space-y-6">
                  <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={seq.presend_webhook_enabled}
                      onChange={(e) =>
                        updateSequence(seqIndex, { presend_webhook_enabled: e.target.checked })
                      }
                      className="w-5 h-5 bg-neutral-800 border-neutral-700 rounded"
                    />
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <WebhookIcon className="w-4 h-4" />
                      Enable Pre-Send Webhook (Send Lead Data)
                    </label>
                  </div>

                  {seq.presend_webhook_enabled && (
                    <div className="space-y-3 ml-7">
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm text-orange-300 flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          This webhook receives the lead data before sending each email. The full lead object (email, name, company, custom_fields, etc.) will be sent to your endpoint.
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={seq.presend_webhook_url}
                          onChange={(e) =>
                            updateSequence(seqIndex, { presend_webhook_url: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://your-api.com/lead-notification"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Method
                        </label>
                        <select
                          value={seq.presend_webhook_method}
                          onChange={(e) =>
                            updateSequence(seqIndex, { presend_webhook_method: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Headers (JSON format, optional)
                        </label>
                        <textarea
                          value={JSON.stringify(seq.presend_webhook_headers, null, 2)}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value);
                              updateSequence(seqIndex, { presend_webhook_headers: headers });
                            } catch (err) {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                          rows={4}
                          placeholder={'{\n  "Authorization": "Bearer YOUR_TOKEN",\n  "Content-Type": "application/json"\n}'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={seq.content_webhook_enabled}
                      onChange={(e) =>
                        updateSequence(seqIndex, { content_webhook_enabled: e.target.checked })
                      }
                      className="w-5 h-5 bg-neutral-800 border-neutral-700 rounded"
                    />
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <WebhookIcon className="w-4 h-4" />
                      Enable Content Webhook (Receive Data for Email)
                    </label>
                  </div>

                  {seq.content_webhook_enabled && (
                    <div className="space-y-3 ml-7">
                      <div className="bg-neutral-700 border border-neutral-600 rounded-lg p-3 text-sm text-neutral-300 flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>How it works:</strong> This webhook receives lead data and should return JSON with subject and body fields.
                          The response fields will replace the email subject and body templates.
                          <br /><br />
                          <strong>Example API response:</strong><br />
                          <code className="text-xs">{'{'}\"subject\": \"Hello John\", \"body\": \"Custom email content...\"{'}'}</code>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={seq.content_webhook_url}
                          onChange={(e) =>
                            updateSequence(seqIndex, { content_webhook_url: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://your-api.com/get-email-content"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Method
                        </label>
                        <select
                          value={seq.content_webhook_method}
                          onChange={(e) =>
                            updateSequence(seqIndex, { content_webhook_method: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Headers (JSON format, optional)
                        </label>
                        <textarea
                          value={JSON.stringify(seq.content_webhook_headers, null, 2)}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value);
                              updateSequence(seqIndex, { content_webhook_headers: headers });
                            } catch (err) {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                          rows={4}
                          placeholder={'{\n  "Authorization": "Bearer YOUR_TOKEN",\n  "Content-Type": "application/json"\n}'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Subject Field Name
                          </label>
                          <input
                            type="text"
                            value={seq.content_webhook_subject_field}
                            onChange={(e) =>
                              updateSequence(seqIndex, { content_webhook_subject_field: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="subject"
                          />
                          <p className="text-xs text-gray-400 mt-1">JSON field containing email subject (e.g., "subject")</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Body Field Name
                          </label>
                          <input
                            type="text"
                            value={seq.content_webhook_body_field}
                            onChange={(e) =>
                              updateSequence(seqIndex, { content_webhook_body_field: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="body"
                          />
                          <p className="text-xs text-gray-400 mt-1">JSON field containing email body (e.g., "body" or "cold_email"). Supports array responses and nested "output" objects.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addSequence}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border-2 border-dashed border-neutral-700"
        >
          <Plus className="w-5 h-5" />
          Add Follow-up Sequence
        </button>
      </div>

      {testEmailModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl max-w-md w-full p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Send Test Email</h2>
              <button
                onClick={() => {
                  setTestEmailModalOpen(false);
                  setTestEmailAddress('');
                }}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-4">
                Send a test email to verify your sequence step. This will use test data and process any webhooks configured.
              </p>

              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              {selectedEmailAccounts.length === 0 && (
                <div className="mt-3 text-sm text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  Note: Please select email accounts in campaign settings before sending test.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTestEmailModalOpen(false);
                  setTestEmailAddress('');
                }}
                className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendTestEmail}
                disabled={sendingTest || !testEmailAddress || selectedEmailAccounts.length === 0}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingTest ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentInput({ onAdd }: { onAdd: (type: 'image' | 'file', url: string, name: string) => void }) {
  const [showInput, setShowInput] = useState(false);
  const [type, setType] = useState<'image' | 'file'>('image');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!url.trim() || !name.trim()) {
      alert('Please enter both URL and name');
      return;
    }
    onAdd(type, url.trim(), name.trim());
    setUrl('');
    setName('');
    setShowInput(false);
  };

  if (!showInput) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => { setType('image'); setShowInput(true); }}
          className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-neutral-700"
        >
          <Image className="w-4 h-4" />
          Add Image
        </button>
        <button
          onClick={() => { setType('file'); setShowInput(true); }}
          className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-neutral-700"
        >
          <Paperclip className="w-4 h-4" />
          Add File
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Add {type === 'image' ? 'Image' : 'File'}</h4>
        <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">File Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="logo.png"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="https://example.com/file.png"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => setShowInput(false)}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

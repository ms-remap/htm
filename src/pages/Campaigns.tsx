import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Play, Pause, Archive, Edit, Trash2, Users, Mail, UserPlus, X } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  leads_count?: number;
  sequences_count?: number;
}

interface CampaignsProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function Campaigns({ onNavigate }: CampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLeadsModal, setShowAddLeadsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const campaignsWithCounts = await Promise.all(
        (data || []).map(async (campaign) => {
          const [leadsRes, sequencesRes] = await Promise.all([
            supabase
              .from('campaign_leads')
              .select('id', { count: 'exact', head: true })
              .eq('campaign_id', campaign.id),
            supabase
              .from('sequences')
              .select('id', { count: 'exact', head: true })
              .eq('campaign_id', campaign.id),
          ]);

          return {
            ...campaign,
            leads_count: leadsRes.count || 0,
            sequences_count: sequencesRes.count || 0,
          };
        })
      );

      setCampaigns(campaignsWithCounts);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-orange-50 text-orange-600';
      case 'paused':
        return 'bg-neutral-200 text-neutral-700';
      case 'draft':
        return 'bg-neutral-100 text-neutral-600';
      case 'archived':
        return 'bg-neutral-100 text-neutral-500';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-neutral-200 rounded-lg w-48" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-neutral-900 mb-2 tracking-tight">Campaigns</h1>
          <p className="text-neutral-500 text-base">Manage your email outreach campaigns</p>
        </div>
        <button
          onClick={() => onNavigate('campaign-editor')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-neutral-400" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No campaigns yet</h3>
          <p className="text-neutral-500 mb-6 text-sm">
            Create your first campaign to start sending emails
          </p>
          <button
            onClick={() => onNavigate('campaign-editor')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-2xl p-6 hover:shadow-md transition-all duration-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">{campaign.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        campaign.status
                      )}`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-neutral-500">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" strokeWidth={2} />
                      <span className="font-medium">{campaign.leads_count} leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" strokeWidth={2} />
                      <span className="font-medium">{campaign.sequences_count} sequences</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {campaign.status === 'active' ? (
                    <button
                      onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all duration-200"
                      title="Pause campaign"
                    >
                      <Pause className="w-4 h-4" strokeWidth={2} />
                    </button>
                  ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                    <button
                      onClick={() => updateCampaignStatus(campaign.id, 'active')}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all duration-200"
                      title="Start campaign"
                    >
                      <Play className="w-4 h-4" strokeWidth={2} />
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowAddLeadsModal(true);
                    }}
                    className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all duration-200"
                    title="Add leads to campaign"
                  >
                    <UserPlus className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() =>
                      onNavigate('campaign-editor', { campaignId: campaign.id })
                    }
                    className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all duration-200"
                    title="Edit campaign"
                  >
                    <Edit className="w-4 h-4" strokeWidth={2} />
                  </button>
                  {campaign.status !== 'archived' && (
                    <button
                      onClick={() => updateCampaignStatus(campaign.id, 'archived')}
                      className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all duration-200"
                      title="Archive campaign"
                    >
                      <Archive className="w-4 h-4" strokeWidth={2} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-all duration-200"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddLeadsModal && selectedCampaign && (
        <AddLeadsModal
          campaign={selectedCampaign}
          onClose={() => {
            setShowAddLeadsModal(false);
            setSelectedCampaign(null);
          }}
          onSuccess={() => {
            loadCampaigns();
            setShowAddLeadsModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}

function AddLeadsModal({
  campaign,
  onClose,
  onSuccess,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailableLeads();
  }, []);

  const loadAvailableLeads = async () => {
    try {
      const { data: allLeads } = await supabase.from('leads').select('*');

      const { data: campaignLeadIds } = await supabase
        .from('campaign_leads')
        .select('lead_id')
        .eq('campaign_id', campaign.id);

      const existingIds = new Set(campaignLeadIds?.map((cl) => cl.lead_id) || []);
      const available = (allLeads || []).filter((lead) => !existingIds.has(lead.id));

      setAvailableLeads(available);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const addLeadsToCampaign = async () => {
    if (selectedLeads.size === 0) return;

    setSaving(true);
    try {
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('email_account_ids')
        .eq('id', campaign.id)
        .single();

      const emailAccountIds = campaignData?.email_account_ids || [];

      if (emailAccountIds.length === 0) {
        alert('Please configure email accounts for this campaign first');
        setSaving(false);
        return;
      }

      const leadsArray = Array.from(selectedLeads);
      const campaignLeadsToAdd = leadsArray.map((leadId, index) => {
        const emailAccountId = emailAccountIds[index % emailAccountIds.length];

        return {
          campaign_id: campaign.id,
          lead_id: leadId,
          email_account_id: emailAccountId,
          status: 'queued',
          current_sequence_step: 0,
          next_followup_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('campaign_leads').insert(campaignLeadsToAdd);
      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error adding leads:', error);
      alert('Failed to add leads to campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Add Leads to Campaign</h2>
            <p className="text-sm text-neutral-500 mt-1 font-medium">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <X className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-neutral-500 font-medium">Loading leads...</div>
          </div>
        ) : availableLeads.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-neutral-400" strokeWidth={2} />
              </div>
              <p className="text-neutral-900 font-medium">No available leads to add</p>
              <p className="text-sm text-neutral-500 mt-2">All your leads are already in this campaign</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-sm text-neutral-500 mb-4 font-medium">
                Select leads to add ({selectedLeads.size} selected)
              </div>
              <div className="space-y-2">
                {availableLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                      className="w-5 h-5 accent-orange-500 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-neutral-900 font-medium">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-sm text-neutral-500">{lead.email}</div>
                      {lead.company && (
                        <div className="text-xs text-neutral-400 mt-0.5">{lead.company}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={addLeadsToCampaign}
                disabled={selectedLeads.size === 0 || saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? 'Adding...' : `Add ${selectedLeads.size} Lead${selectedLeads.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

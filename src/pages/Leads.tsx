import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  X,
} from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  website: string | null;
  linkedin_url: string | null;
  tags: string[];
  status: string;
  created_at: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredLeads(
        leads.filter(
          (lead) =>
            lead.email.toLowerCase().includes(query) ||
            lead.first_name?.toLowerCase().includes(query) ||
            lead.last_name?.toLowerCase().includes(query) ||
            lead.company?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredLeads(leads);
    }
  }, [searchQuery, leads]);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      loadLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const importCSV = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to import leads');
        return;
      }

      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

      const leadsToImport = lines.slice(1).map((line) => {
        const values = line.split(delimiter).map((v) => v.trim());
        const lead: any = {
          user_id: user.id,
          custom_fields: {},
          status: 'active',
        };

        headers.forEach((header, index) => {
          const value = values[index] || null;

          switch (header) {
            case 'email':
              lead.email = value;
              break;
            case 'name':
              if (value && value.includes(' ')) {
                const parts = value.split(' ');
                lead.first_name = parts[0];
                lead.last_name = parts.slice(1).join(' ');
              } else {
                lead.first_name = value;
              }
              break;
            case 'first_name':
            case 'firstname':
              lead.first_name = value;
              break;
            case 'last_name':
            case 'lastname':
              lead.last_name = value;
              break;
            case 'company':
              lead.company = value;
              break;
            case 'title':
            case 'job_title':
              lead.title = value;
              break;
            case 'phone':
              lead.phone = value;
              break;
            case 'website':
              lead.website = value;
              break;
            case 'linkedin':
            case 'linkedin_url':
              lead.linkedin_url = value;
              break;
            case 'status':
              lead.status = value || 'active';
              break;
            default:
              if (value && value !== '') {
                lead.custom_fields[header] = value;
              }
              break;
          }
        });

        return lead;
      });

      const { error } = await supabase.from('leads').insert(
        leadsToImport.filter((lead: any) => lead.email)
      );

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const validLeads = leadsToImport.filter((lead: any) => lead.email);
      loadLeads();
      setShowImportModal(false);
      alert(`Successfully imported ${validLeads.length} leads`);
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to import CSV: ${errorMessage}\n\nPlease check:\n- File has email column\n- CSV is properly formatted\n- Check browser console for details`);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800 rounded w-48" />
          <div className="h-64 bg-neutral-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
          <p className="text-gray-400">Manage your contact database</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No leads yet</h3>
          <p className="text-gray-400 mb-6">
            Import a CSV file or add leads manually to get started
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Lead
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {lead.first_name} {lead.last_name}
                      </div>
                      {lead.linkedin_url && (
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          LinkedIn
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{lead.email}</div>
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-orange-400 truncate block max-w-xs"
                        >
                          {lead.website}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{lead.company || '-'}</div>
                      {lead.custom_fields?.country && (
                        <div className="text-xs text-gray-500">{lead.custom_fields.country}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{lead.title || '-'}</div>
                      {lead.custom_fields?.industry && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {lead.custom_fields.industry}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl max-w-md w-full p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Import Leads from CSV</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-gray-400 text-sm mb-4 space-y-2">
              <p className="font-medium">Supports both comma and tab-delimited files.</p>
              <p className="text-xs">
                <strong>Core fields:</strong> name (or first_name, last_name), email, company, title, phone, website, linkedin_url
              </p>
              <p className="text-xs">
                <strong>Additional fields:</strong> All other columns will be stored in custom_fields for advanced filtering
              </p>
              <p className="text-xs text-orange-400">
                Note: If using "name" column, it will be automatically split into first and last name
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCSV(file);
              }}
              className="w-full text-gray-300"
            />
          </div>
        </div>
      )}

      {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSuccess={loadLeads} />}
    </div>
  );
}

function AddLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    title: '',
    phone: '',
    website: '',
    linkedin_url: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('leads').insert([formData]);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding lead:', error);
      alert('Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 border border-neutral-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
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
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
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
              {saving ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

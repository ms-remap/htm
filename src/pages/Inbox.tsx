import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Search, RefreshCw } from 'lucide-react';

interface InboxMessage {
  id: string;
  from_email: string;
  subject: string | null;
  body: string | null;
  is_read: boolean;
  received_at: string;
}

export default function Inbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSelectMessage = (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(
        (msg) =>
          msg.from_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800 rounded w-48" />
          <div className="h-96 bg-neutral-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Inbox</h1>
          <p className="text-gray-400">Manage email replies and conversations</p>
        </div>
        <button
          onClick={loadMessages}
          className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No messages yet</h3>
          <p className="text-gray-400">
            Email replies will appear here when leads respond to your campaigns
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-11 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`w-full text-left p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-neutral-800/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-white truncate flex-1">
                      {message.from_email}
                    </div>
                    {!message.is_read && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <div className="text-sm text-gray-400 truncate mb-1">
                    {message.subject || 'No subject'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.received_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {selectedMessage ? (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-neutral-800">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {selectedMessage.subject || 'No subject'}
                  </h2>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      From: {selectedMessage.from_email}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(selectedMessage.received_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {selectedMessage.body || 'No content'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a message to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

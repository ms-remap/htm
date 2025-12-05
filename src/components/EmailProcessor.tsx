import { useState, useEffect } from 'react';
import { Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { processPendingEmails } from '../services/emailSender';

interface EmailProcessorProps {
  autoProcess?: boolean;
  intervalSeconds?: number;
}

export default function EmailProcessor({ autoProcess = false, intervalSeconds = 60 }: EmailProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [stats, setStats] = useState({ processed: 0, sent: 0, failed: 0 });
  const [isEnabled, setIsEnabled] = useState(autoProcess);

  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(async () => {
      await processEmails();
    }, intervalSeconds * 1000);

    processEmails();

    return () => clearInterval(interval);
  }, [isEnabled, intervalSeconds]);

  const processEmails = async () => {
    if (processing) return;

    setProcessing(true);
    try {
      const result = await processPendingEmails(10);
      setStats(result);
      setLastRun(new Date());

      if (result.processed > 0) {
        console.log(`Processed ${result.processed} emails: ${result.sent} sent, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('Error processing emails:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Email Queue Processor</h3>
          <p className="text-sm text-gray-400">
            {isEnabled
              ? `Auto-processing every ${intervalSeconds} seconds`
              : 'Manual processing only'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-600 text-orange-600 focus:ring-orange-500"
            />
            Auto-process
          </label>
          <button
            onClick={processEmails}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {processing ? 'Processing...' : 'Send Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Processed
          </div>
          <div className="text-2xl font-bold text-white">{stats.processed}</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Sent
          </div>
          <div className="text-2xl font-bold text-white">{stats.sent}</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <XCircle className="w-4 h-4" />
            Failed
          </div>
          <div className="text-2xl font-bold text-white">{stats.failed}</div>
        </div>
      </div>

      {lastRun && (
        <div className="mt-4 text-sm text-gray-400">
          Last run: {lastRun.toLocaleString()}
        </div>
      )}
    </div>
  );
}

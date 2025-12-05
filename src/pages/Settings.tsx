import { useState } from 'react';
import { Settings as SettingsIcon, User, Clock, Globe } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    timezone: 'UTC',
    sendingHoursStart: '09:00',
    sendingHoursEnd: '17:00',
    sendingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  });

  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const toggleDay = (day: string) => {
    if (settings.sendingDays.includes(day)) {
      setSettings({
        ...settings,
        sendingDays: settings.sendingDays.filter((d) => d !== day),
      });
    } else {
      setSettings({
        ...settings,
        sendingDays: [...settings.sendingDays, day],
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold text-neutral-900 mb-2 tracking-tight">Settings</h1>
        <p className="text-neutral-500">Configure your account and preferences</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-orange-500" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Acme Inc"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-500" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Timezone</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Default Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="America/Honolulu">Hawaii Time (HT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Paris (CET/CEST)</option>
              <option value="Europe/Berlin">Berlin (CET/CEST)</option>
              <option value="Europe/Rome">Rome (CET/CEST)</option>
              <option value="Europe/Madrid">Madrid (CET/CEST)</option>
              <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Asia/Singapore">Singapore (SGT)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Seoul">Seoul (KST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
              <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
              <option value="Australia/Melbourne">Melbourne (AEDT/AEST)</option>
              <option value="Pacific/Auckland">Auckland (NZDT/NZST)</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Sending Schedule</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.sendingHoursStart}
                  onChange={(e) =>
                    setSettings({ ...settings, sendingHoursStart: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.sendingHoursEnd}
                  onChange={(e) =>
                    setSettings({ ...settings, sendingHoursEnd: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Sending Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      settings.sendingDays.includes(day)
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-neutral-600" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Email Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-neutral-900 font-medium">Track Email Opens</div>
                <div className="text-sm text-neutral-500">
                  Insert tracking pixels to monitor open rates
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-sm"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-neutral-900 font-medium">Track Link Clicks</div>
                <div className="text-sm text-neutral-500">
                  Replace links with tracking URLs
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-sm"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-neutral-900 font-medium">Auto-unsubscribe</div>
                <div className="text-sm text-neutral-500">
                  Automatically stop emailing leads who unsubscribe
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-sm"></div>
              </label>
            </div>
          </div>
        </div>

        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-sm">
          Save Settings
        </button>
      </div>
    </div>
  );
}

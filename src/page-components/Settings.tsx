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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your account and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Acme Inc"
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Timezone</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <optgroup label="North America">
                <option value="America/New_York">Eastern Time (New York)</option>
                <option value="America/Chicago">Central Time (Chicago)</option>
                <option value="America/Denver">Mountain Time (Denver)</option>
                <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                <option value="America/Phoenix">Arizona (Phoenix)</option>
                <option value="America/Anchorage">Alaska (Anchorage)</option>
                <option value="Pacific/Honolulu">Hawaii (Honolulu)</option>
                <option value="America/Toronto">Eastern Time (Toronto)</option>
                <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                <option value="America/Mexico_City">Central Time (Mexico City)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Dublin">Dublin</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Europe/Madrid">Madrid</option>
                <option value="Europe/Rome">Rome</option>
                <option value="Europe/Amsterdam">Amsterdam</option>
                <option value="Europe/Brussels">Brussels</option>
                <option value="Europe/Vienna">Vienna</option>
                <option value="Europe/Athens">Athens</option>
                <option value="Europe/Helsinki">Helsinki</option>
                <option value="Europe/Stockholm">Stockholm</option>
                <option value="Europe/Copenhagen">Copenhagen</option>
                <option value="Europe/Oslo">Oslo</option>
                <option value="Europe/Warsaw">Warsaw</option>
                <option value="Europe/Prague">Prague</option>
                <option value="Europe/Budapest">Budapest</option>
                <option value="Europe/Zurich">Zurich</option>
                <option value="Europe/Moscow">Moscow</option>
                <option value="Europe/Istanbul">Istanbul</option>
              </optgroup>
              <optgroup label="Asia">
                <option value="Asia/Dubai">Dubai (UAE)</option>
                <option value="Asia/Kolkata">India (Kolkata)</option>
                <option value="Asia/Mumbai">India (Mumbai)</option>
                <option value="Asia/Karachi">Pakistan (Karachi)</option>
                <option value="Asia/Dhaka">Bangladesh (Dhaka)</option>
                <option value="Asia/Bangkok">Thailand (Bangkok)</option>
                <option value="Asia/Singapore">Singapore</option>
                <option value="Asia/Manila">Philippines (Manila)</option>
                <option value="Asia/Hong_Kong">Hong Kong</option>
                <option value="Asia/Shanghai">China (Shanghai)</option>
                <option value="Asia/Beijing">China (Beijing)</option>
                <option value="Asia/Tokyo">Japan (Tokyo)</option>
                <option value="Asia/Seoul">South Korea (Seoul)</option>
                <option value="Asia/Jakarta">Indonesia (Jakarta)</option>
                <option value="Asia/Kuala_Lumpur">Malaysia (Kuala Lumpur)</option>
                <option value="Asia/Ho_Chi_Minh">Vietnam (Ho Chi Minh)</option>
                <option value="Asia/Taipei">Taiwan (Taipei)</option>
                <option value="Asia/Riyadh">Saudi Arabia (Riyadh)</option>
                <option value="Asia/Jerusalem">Israel (Jerusalem)</option>
                <option value="Asia/Tehran">Iran (Tehran)</option>
              </optgroup>
              <optgroup label="Australia & Pacific">
                <option value="Australia/Sydney">Sydney (AEST)</option>
                <option value="Australia/Melbourne">Melbourne</option>
                <option value="Australia/Brisbane">Brisbane</option>
                <option value="Australia/Perth">Perth</option>
                <option value="Australia/Adelaide">Adelaide</option>
                <option value="Pacific/Auckland">New Zealand (Auckland)</option>
                <option value="Pacific/Fiji">Fiji</option>
                <option value="Pacific/Guam">Guam</option>
              </optgroup>
              <optgroup label="South America">
                <option value="America/Sao_Paulo">Brazil (São Paulo)</option>
                <option value="America/Buenos_Aires">Argentina (Buenos Aires)</option>
                <option value="America/Santiago">Chile (Santiago)</option>
                <option value="America/Bogota">Colombia (Bogotá)</option>
                <option value="America/Lima">Peru (Lima)</option>
                <option value="America/Caracas">Venezuela (Caracas)</option>
              </optgroup>
              <optgroup label="Africa">
                <option value="Africa/Cairo">Egypt (Cairo)</option>
                <option value="Africa/Johannesburg">South Africa (Johannesburg)</option>
                <option value="Africa/Lagos">Nigeria (Lagos)</option>
                <option value="Africa/Nairobi">Kenya (Nairobi)</option>
                <option value="Africa/Casablanca">Morocco (Casablanca)</option>
                <option value="Africa/Algiers">Algeria (Algiers)</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Sending Schedule</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.sendingHoursStart}
                  onChange={(e) =>
                    setSettings({ ...settings, sendingHoursStart: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.sendingHoursEnd}
                  onChange={(e) =>
                    setSettings({ ...settings, sendingHoursEnd: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Sending Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      settings.sendingDays.includes(day)
                        ? 'bg-orange-600 text-white'
                        : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Email Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Track Email Opens</div>
                <div className="text-sm text-gray-400">
                  Insert tracking pixels to monitor open rates
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Track Link Clicks</div>
                <div className="text-sm text-gray-400">
                  Replace links with tracking URLs
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Auto-unsubscribe</div>
                <div className="text-sm text-gray-400">
                  Automatically stop emailing leads who unsubscribe
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>
        </div>

        <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}

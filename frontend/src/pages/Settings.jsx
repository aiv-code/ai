import { useState, useEffect } from 'react';
import { Save, LogOut, Moon, Sun, Key, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user, logout, updateSettings } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    apiKey: '',
    notifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedApiKey = localStorage.getItem('apiKey') || '';
    const savedNotifications = localStorage.getItem('notifications') !== 'false';

    setSettings({
      theme: savedTheme,
      apiKey: savedApiKey,
      notifications: savedNotifications,
    });
    
    // If no API key is set, suggest the default one
    if (!savedApiKey) {
      console.log('No API key set. Default API key for Demo Client: M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ');
    }

    // Apply theme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setSettings({ ...settings, theme: newTheme });
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem('theme', settings.theme);
      localStorage.setItem('apiKey', settings.apiKey);
      localStorage.setItem('notifications', settings.notifications.toString());

      // If updateSettings function exists, call it
      if (updateSettings) {
        await updateSettings(settings);
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* User Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900 mt-1">{user?.email || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">User ID</label>
              <p className="text-gray-900 mt-1 font-mono text-sm">{user?.id || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">API Key</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="password"]');
                    if (input.type === 'password') {
                      input.type = 'text';
                    } else {
                      input.type = 'password';
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Show
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your API key is used to authenticate requests to the backend API
              </p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800 font-medium mb-1">Quick Setup:</p>
                <p className="text-xs text-blue-700 mb-2">
                  If you're using the default Docker setup, use this API key:
                </p>
                <div className="bg-white p-2 rounded border border-blue-200 mb-2">
                  <code className="text-xs text-gray-800 break-all">
                    M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ
                  </code>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ');
                        alert('API key copied to clipboard!');
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setSettings({ ...settings, apiKey: 'M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ' });
                        localStorage.setItem('apiKey', 'M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ');
                        alert('API key set! Click "Save Settings" to confirm.');
                      }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Use This Key
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-700">
                  Data sources are filtered by client. Use the <a href="/admin" className="underline font-medium">Admin page</a> to view all clients and their API keys.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            {settings.theme === 'dark' ? (
              <Moon className="w-5 h-5 text-gray-600" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Theme
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive email updates about your queries</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({ ...settings, notifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


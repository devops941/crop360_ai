'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  MessageSquare, 
  Smartphone, 
  Send, 
  Radio, 
  CloudRain, 
  Bug, 
  TrendingUp, 
  CheckCheck
} from 'lucide-react';

interface AlertItem {
  _id: string;
  category: 'WEATHER' | 'PEST_DISEASE' | 'IRRIGATION' | 'MARKET_PRICE' | 'HARVEST' | 'SYSTEM';
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  messageVernacular?: {
    ta?: string;
    hi?: string;
  };
  channels: string[];
  deliveryStatus: {
    inApp: string;
    sms?: string;
    whatsapp?: string;
  };
  isRead: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Form State for Broadcast
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('WEATHER');
  const [severity, setSeverity] = useState('WARNING');
  const [smsChannel, setSmsChannel] = useState(true);
  const [waChannel, setWaChannel] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAlerts(data.data);
      } else {
        // Fallback default sample alerts
        setAlerts([
          {
            _id: 'sample-1',
            category: 'WEATHER',
            severity: 'CRITICAL',
            title: 'IMD Alert: Heavy Rain Expected in 18 Hours',
            message: 'Low depression over Bay of Bengal is expected to cause 65-80mm rain in Thanjavur delta. Suspend urea top-dressing immediately.',
            messageVernacular: {
              ta: 'வானிலை எச்சரிக்கை: அடுத்த 18 மணி நேரத்தில் கனமழை எதிர்பார்க்கப்படுகிறது. உரமிடுவதை உடனடியாக ஒத்திவைக்கவும்.',
              hi: 'मौसम चेतावनी: अगले 18 घंटों में भारी बारिश की संभावना। यूरिया का छिड़काव तुरंत रोकें।'
            },
            channels: ['IN_APP', 'SMS', 'WHATSAPP'],
            deliveryStatus: { inApp: 'DELIVERED', sms: 'SENT', whatsapp: 'SENT' },
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            _id: 'sample-2',
            category: 'MARKET_PRICE',
            severity: 'SUCCESS',
            title: 'Mandi Price Spike: Basmati Paddy 1121 up ₹240/qtl',
            message: 'Karnal & Khanna Mandi spot prices crossed ₹3,920/qtl due to export clearance demand. Recommended to offload 40% warehouse stock.',
            messageVernacular: {
              ta: 'சந்தை விலை உயர்வு: பாஸ்மதி நெல் விலை குவிண்டாலுக்கு ₹240 உயர்ந்துள்ளது.',
              hi: 'मंडी भाव में तेजी: बासमती धान के भाव में ₹240/क्विंटल का उछाल।'
            },
            channels: ['IN_APP', 'WHATSAPP'],
            deliveryStatus: { inApp: 'DELIVERED', whatsapp: 'SENT' },
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            _id: 'sample-3',
            category: 'PEST_DISEASE',
            severity: 'WARNING',
            title: 'Early Blight Spore Outbreak Alert in Block-C',
            message: 'High humidity (88%) and 24°C night temperature detected. Recommend preventive spray of Mancozeb 75% WP @ 2g/L.',
            messageVernacular: {
              ta: 'நோய் எச்சரிக்கை: தொகுதி-சியில் ஆரம்பகால கருகல் நோய் தடுப்பு மருந்து தெளிக்க பரிந்துரைக்கப்படுகிறது.',
              hi: 'रोग चेतावनी: ब्लॉक-सी में अगेती झुलसा का खतरा, मैंकोजेब का छिड़काव करें।'
            },
            channels: ['IN_APP', 'SMS'],
            deliveryStatus: { inApp: 'DELIVERED', sms: 'SENT' },
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          }
        ]);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id }),
      });
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, farmerId: 'FARMER_DEFAULT' }),
      });
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    const channels = ['IN_APP'];
    if (smsChannel) channels.push('SMS');
    if (waChannel) channels.push('WHATSAPP');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          category,
          severity,
          channels,
          farmerId: 'FARMER_DEFAULT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle('');
        setMessage('');
        setIsBroadcasting(false);
        fetchAlerts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterCategory !== 'ALL' && a.category !== filterCategory) return false;
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> WARNING</span>;
      case 'SUCCESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> INFO</span>;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'WEATHER': return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'PEST_DISEASE': return <Bug className="w-5 h-5 text-rose-400" />;
      case 'MARKET_PRICE': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      default: return <Bell className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121B14] text-stone-900 dark:text-stone-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 dark:border-[#245C3A]/30 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#245C3A] text-white rounded-xl shadow-lg">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Agricultural Sentinel & Multi-Channel Alerts</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Automated weather risks, spray alerts, mandi spike warnings & WhatsApp dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-[#1E2E21] dark:hover:bg-[#253929] border border-stone-200 dark:border-[#245C3A]/40 transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            Mark All Read
          </button>
          <button
            onClick={() => setIsBroadcasting(!isBroadcasting)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#245C3A] hover:bg-[#1e4e31] text-white shadow-md transition"
          >
            <Send className="w-4 h-4" />
            Broadcast Alert
          </button>
        </div>
      </div>

      {/* Broadcast Form Drawer */}
      {isBroadcasting && (
        <form onSubmit={handleSendBroadcast} className="mt-6 p-6 rounded-2xl bg-white dark:bg-[#162218] border border-stone-200 dark:border-[#245C3A]/40 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-[#245C3A] dark:text-emerald-400 flex items-center gap-2">
            <Radio className="w-4 h-4" /> Dispatch Targeted Farm Advisory or Emergency Warning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Alert Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Cyclone Michaung Heavy Wind Warning"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-[#1B291D] border border-stone-200 dark:border-[#245C3A]/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-[#1B291D] border border-stone-200 dark:border-[#245C3A]/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="WEATHER">Weather & Climate</option>
                <option value="PEST_DISEASE">Pest & Disease Advisory</option>
                <option value="IRRIGATION">Irrigation Advisory</option>
                <option value="MARKET_PRICE">Market Price Trigger</option>
                <option value="HARVEST">Harvest Readiness</option>
                <option value="SYSTEM">General System</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-[#1B291D] border border-stone-200 dark:border-[#245C3A]/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="CRITICAL">Critical (Immediate Field Action)</option>
                <option value="WARNING">Warning (Review Needed)</option>
                <option value="INFO">Info (General Update)</option>
                <option value="SUCCESS">Success (Milestone / Price Hike)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Detailed Message</label>
            <textarea
              required
              rows={2}
              placeholder="Provide actionable advisory, preventive measures, or target farm sectors..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-[#1B291D] border border-stone-200 dark:border-[#245C3A]/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 text-xs font-medium">
              <span>Dispatch Channels:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={smsChannel} onChange={e => setSmsChannel(e.target.checked)} className="rounded text-[#245C3A]" />
                <Smartphone className="w-3.5 h-3.5" /> SMS Push
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={waChannel} onChange={e => setWaChannel(e.target.checked)} className="rounded text-[#245C3A]" />
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Cloud
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBroadcasting(false)}
                className="px-3 py-1.5 text-xs rounded-lg hover:bg-stone-200 dark:hover:bg-[#1E2E21]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#245C3A] hover:bg-[#1e4e31] text-white shadow"
              >
                Send Broadcast
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'WEATHER', 'PEST_DISEASE', 'MARKET_PRICE', 'IRRIGATION'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterCategory === cat
                  ? 'bg-[#245C3A] text-white'
                  : 'bg-white dark:bg-[#162218] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-[#245C3A]/30'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {['ALL', 'CRITICAL', 'WARNING', 'SUCCESS', 'INFO'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterSeverity === sev
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-white dark:bg-[#162218] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-[#245C3A]/30'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="p-12 text-center text-sm text-stone-500">Loading Sentinel Alert feeds...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#162218] border border-stone-200 dark:border-[#245C3A]/30 text-stone-500">
            No notifications match your current filter.
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert._id}
              className={`p-5 rounded-2xl border transition shadow-sm ${
                alert.isRead
                  ? 'bg-white/80 dark:bg-[#162218]/80 border-stone-200 dark:border-[#245C3A]/20 opacity-90'
                  : 'bg-white dark:bg-[#162218] border-l-4 border-l-[#245C3A] dark:border-l-emerald-500 border-stone-200 dark:border-[#245C3A]/40 ring-1 ring-[#245C3A]/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-[#1B291D] border border-stone-200 dark:border-[#245C3A]/30 mt-0.5">
                    {getCategoryIcon(alert.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{alert.title}</h3>
                      {getSeverityBadge(alert.severity)}
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{alert.message}</p>

                    {/* Vernacular Box */}
                    {alert.messageVernacular && (
                      <div className="mt-2.5 p-3 rounded-xl bg-stone-50 dark:bg-[#121B14] border border-stone-200 dark:border-[#245C3A]/20 space-y-1 text-xs">
                        {alert.messageVernacular.ta && (
                          <div className="text-stone-700 dark:text-emerald-300/90 font-medium">
                            <span className="text-[10px] uppercase font-bold text-stone-400 mr-1.5">[தமிழ்]</span>
                            {alert.messageVernacular.ta}
                          </div>
                        )}
                        {alert.messageVernacular.hi && (
                          <div className="text-stone-700 dark:text-emerald-300/90 font-medium">
                            <span className="text-[10px] uppercase font-bold text-stone-400 mr-1.5">[हिंदी]</span>
                            {alert.messageVernacular.hi}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400 pt-2">
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        Channels:
                        {alert.channels.map(ch => (
                          <span key={ch} className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-[#1E2E21] text-stone-700 dark:text-stone-300 font-mono text-[10px]">
                            {ch}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(alert._id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#1E2E21] border border-emerald-500/30 transition"
                    >
                      Mark Read
                    </button>
                  )}
                  {alert.deliveryStatus.whatsapp === 'SENT' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> WhatsApp Sent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

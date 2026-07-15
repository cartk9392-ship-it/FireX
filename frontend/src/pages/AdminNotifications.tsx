import React, { useEffect, useState } from 'react';
import { Bell, Send } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import Badge from '../components/Badge';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch('/api/settings/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Show newest first
        setNotifications(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setAlertMsg(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, message })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: 'Announcement broadcasted to all players successfully.' });
        setTitle('');
        setMessage('');
        fetchNotifications(); // Refresh list
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to dispatch broadcast.' });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Broadcast Center</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Draft system-wide alerts, push updates, and notify players of tournaments status changes
        </p>
      </div>

      {alertMsg && (
        <Alert type={alertMsg.type} onClose={() => setAlertMsg(null)}>
          {alertMsg.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card title="New Broadcast Bulletin" subtitle="Pushes an alert to every player dashboard instantly">
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Maintenance or Registration Open"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Bulletin Message</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Draft details here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none font-sans leading-relaxed"
                />
              </div>

              <Button type="submit" className="w-full justify-center" icon={<Send size={14} />} disabled={submitting}>
                {submitting ? 'Dispatching Bulletins...' : 'Broadcast to All'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card title="Announcements History" subtitle="Audit logs of past system announcements and individual alerts">
            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-textGray text-xs italic">
                <Bell size={36} className="mx-auto mb-3 opacity-20" />
                No notification alerts logged yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${n.userId === 'all' ? 'bg-orange-500/10 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                      <Bell size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{n.title}</h4>
                          <Badge variant={n.userId === 'all' ? 'warning' : 'neutral'}>
                            {n.userId === 'all' ? 'Global' : 'Direct'}
                          </Badge>
                        </div>
                        <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                          {new Date(n.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-textGray mt-1 leading-relaxed font-semibold">{n.message}</p>
                      {n.userId !== 'all' && (
                        <span className="inline-block mt-2 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          Recipient ID: #{n.userId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;

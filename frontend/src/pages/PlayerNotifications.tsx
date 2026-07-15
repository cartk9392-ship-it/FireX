import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckSquare } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Badge from '../components/Badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export const PlayerNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch('/api/settings/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
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

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('firex_token');
      const response = await fetch(`/api/settings/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => {
          if (n.id === id) return { ...n, read: true };
          return n;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await handleMarkAsRead(n.id);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-textGray font-semibold mt-1">
            Check live notifications, tournament brackets details, and prizes
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} icon={<CheckSquare size={14} />}>
            Mark All Read
          </Button>
        )}
      </div>

      <Card title={`Active Bulletins (${unreadCount} Unread)`}>
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-textGray">
            <Bell size={48} className="mx-auto mb-4 opacity-25" />
            <p className="text-sm font-bold">Your notification inbox is empty.</p>
            <p className="text-xs mt-1">We'll alert you here when rooms open or when prizes are distributed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`py-4 flex items-start gap-4 transition first:pt-0 last:pb-0 ${!n.read ? 'bg-slate-900/10' : 'opacity-70'}`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${!n.read ? 'bg-orange-500/10 text-primary' : 'bg-slate-800 text-textGray'}`}>
                  <Bell size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{n.title}</h4>
                    {!n.read && <Badge variant="warning">New</Badge>}
                  </div>
                  <p className="text-xs text-textGray mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-2 block font-semibold">
                    {new Date(n.date).toLocaleString()}
                  </span>
                </div>

                {!n.read && (
                  <button 
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 hover:bg-slate-800 text-textGray hover:text-white rounded-lg transition"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default PlayerNotifications;

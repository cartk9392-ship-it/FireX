import React, { useEffect, useState } from 'react';
import { Mail, Award } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';

interface AppSettings {
  logoUrl: string;
  appName: string;
  contactEmail: string;
  privacyPolicy: string;
  termsConditions: string;
}

export const PlayerSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">Platform Configurations</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Website branding, privacy policies, and support details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card title="Organization Branding">
            <div className="text-center p-4 bg-slate-900 border border-slate-800 rounded-xl">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="FireX Logo" 
                  className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 border border-slate-700" 
                />
              ) : (
                <div className="w-16 h-16 rounded-xl orange-gradient-bg flex items-center justify-center text-white mx-auto mb-4">
                  <Award size={28} />
                </div>
              )}
              <h3 className="text-base font-bold text-white leading-tight">{settings?.appName || "FireX ERP"}</h3>
              <p className="text-xs text-textGray mt-1">Free Fire brackets systems</p>
            </div>
          </Card>

          <Card title="Contact Support">
            <div className="flex items-center gap-3.5 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div className="truncate">
                <span className="block text-[10px] text-textGray uppercase font-bold tracking-wider">Assistance Email</span>
                <span className="text-xs font-bold text-white truncate block">{settings?.contactEmail || "support@firex-erp.com"}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card title="Privacy Policy">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-textGray leading-relaxed font-semibold">
              {settings?.privacyPolicy || "No privacy policies have been registered by the admin."}
            </div>
          </Card>

          <Card title="Terms & Conditions">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-textGray leading-relaxed font-semibold">
              {settings?.termsConditions || "No terms and conditions have been registered by the admin."}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default PlayerSettings;

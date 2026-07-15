import React, { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        setAppName(data.appName || '');
        setLogoUrl(data.logoUrl || '');
        setContactEmail(data.contactEmail || '');
        setPrivacyPolicy(data.privacyPolicy || '');
        setTermsConditions(data.termsConditions || '');
        setUpiId(data.upiId || '');
        setUpiQrUrl(data.upiQrUrl || '');
        setYoutubeUrl(data.youtubeUrl || '');
        setWhatsappUrl(data.whatsappUrl || '');
      }
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Failed to retrieve system settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem('firex_token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appName,
          logoUrl,
          contactEmail,
          privacyPolicy,
          termsConditions,
          upiId,
          upiQrUrl,
          youtubeUrl,
          whatsappUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: 'System settings updated successfully.' });
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to update configurations.' });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-textGray font-semibold mt-1">
          Customize website logo banners, terms of agreement, support coordinates, and app titles
        </p>
      </div>

      {alertMsg && (
        <Alert type={alertMsg.type} onClose={() => setAlertMsg(null)}>
          {alertMsg.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card title="Portal Identity">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Application Title</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Branding Support Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                  />
                  <p className="text-[9px] text-textGray">Hidden in footer, opens email client dynamically on icon click</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">YouTube Channel Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://www.youtube.com/@channel"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">WhatsApp Group Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://chat.whatsapp.com/..."
                    value={whatsappUrl}
                    onChange={(e) => setWhatsappUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none"
                  />
                </div>
              </div>
            </Card>

            <Card title="Media Asset Logo Preview">
              <div className="text-center p-4 bg-slate-950 border border-slate-850 rounded-xl">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Current System Logo"
                    className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-700 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl orange-gradient-bg flex items-center justify-center text-white mx-auto mb-4">
                    <Settings size={36} />
                  </div>
                )}
                <div className="space-y-1 text-left mt-4">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Upload Logo Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLogoUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-textGray file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 file:cursor-pointer bg-slate-950 border border-slate-800 rounded-lg p-2 focus:border-primary outline-none"
                  />
                  <p className="text-[10px] text-textGray">Choose a logo image from your device to update website branding</p>
                </div>
              </div>
            </Card>

            {/* UPI Payment Settings */}
            <Card title="💳 UPI Payment Settings" subtitle="Players dekhenge ye details jab deposit karenge">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@ybl or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none font-mono"
                  />
                  <p className="text-[10px] text-textGray">Ye UPI ID player wallet page pe dikhega copy karne ke liye</p>
                </div>

                <div className="space-y-1">
                <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">QR Code Scanner Image *</label>
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setUpiQrUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-textGray file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 file:cursor-pointer bg-slate-950 border border-slate-800 rounded-lg p-2 focus:border-primary outline-none"
                  />
                  <p className="text-[10px] text-textGray">Apne phone ya device se PhonePe/GPay QR code image select karein</p>
                </div>
              </div>

              {/* QR Preview */}
              {upiQrUrl && (
                <div className="mt-2">
                  <p className="text-[10px] text-textGray font-bold uppercase mb-2">QR Preview:</p>
                  <div className="bg-white rounded-xl p-3 w-32 h-32 flex items-center justify-center relative group">
                    <img
                      src={upiQrUrl}
                      alt="UPI QR Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUpiQrUrl('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove QR"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

          <div className="md:col-span-2 space-y-6">
            <Card title="Legal Guidelines & Conditions">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Privacy Policy Content</label>
                  <textarea
                    rows={6}
                    required
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none font-sans leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-textGray font-bold uppercase tracking-wider block">Tournament Terms & Agreements</label>
                  <textarea
                    rows={6}
                    required
                    value={termsConditions}
                    onChange={(e) => setTermsConditions(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg text-xs font-semibold text-white outline-none font-sans leading-relaxed"
                  />
                </div>
              </div>
            </Card>
            
            <div className="flex justify-end">
              <Button type="submit" icon={<Save size={14} />} disabled={submitting}>
                {submitting ? 'Saving Configurations...' : 'Save Configurations'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;

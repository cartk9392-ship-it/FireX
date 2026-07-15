import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Card from '../components/Card';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    const result = await login(email, password, true); // true indicates admin panel login
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Invalid Email or Password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Red Glow for Admin Section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shadow-md text-red-500">
            <ShieldAlert size={18} />
          </div>
          <span className="text-lg font-black uppercase tracking-tight text-white animate-pulse">
            Fire<span className="text-red-500">X</span> ERP
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold uppercase text-white tracking-tight">Super Admin Portal</h2>
        <p className="mt-2 text-xs text-textGray font-semibold">
          Authorized management login. Security auditing is active.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="px-10 py-8 border-red-900/30 bg-slate-900/80 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} />}

            <Input
              label="Admin Email"
              type="email"
              placeholder="e.g. admin@firex-erp.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus:ring-red-500/20 focus:border-red-500 border-slate-800"
            />

            <Input
              label="Security Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus:ring-red-500/20 focus:border-red-500 border-slate-800"
            />

            <Button
              type="submit"
              variant="danger"
              className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 py-3"
              loading={loading}
            >
              Sign In to Management
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 flex items-center justify-between text-xs font-semibold">
            <Link to="/login" className="text-primary hover:underline flex items-center gap-1">
              <ArrowLeft size={12} />
              Player Login
            </Link>
            <span className="text-textGray">Root Access Only</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default AdminLogin;

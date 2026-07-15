import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Card from '../components/Card';

export const PlayerLogin: React.FC = () => {
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
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Invalid Email or Password");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center bg-slate-950 shrink-0">
            <img src="/icon-192.png" alt="FireX" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-black uppercase tracking-tight text-white">
            Fire<span className="text-primary text-glow-orange">X</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold uppercase text-white tracking-tight">FireX Portal</h2>
        <p className="mt-2 text-xs text-textGray font-semibold">
          Access your tournament dashboard, wallet, and game schedules
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="px-10 py-8 border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <Alert type="error" message={error} />}

            <Input
              label="Gmail Address"
              type="email"
              placeholder="e.g. rohan@gmail.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Sign In to Dashboard
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 flex items-center justify-between text-xs font-semibold">
            <span className="text-textGray">
              New player?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Create Account
              </Link>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default PlayerLogin;

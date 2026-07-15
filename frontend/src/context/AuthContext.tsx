import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'player' | 'admin';
  walletBalance: number;
  inGameName?: string;
  inGameUid?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, isAdmin: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, inGameName?: string, inGameUid?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateWalletBalance: (newBalance: number) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('firex_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchProfile = async (currentToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token invalid/expired
        logout();
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string, isAdmin: boolean) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || "Invalid credentials" };
      }

      // Check role constraint based on target form
      if (isAdmin && data.user.role !== 'admin') {
        return { success: false, message: "Unauthorized login panel" };
      }
      if (!isAdmin && data.user.role !== 'player') {
        return { success: false, message: "Please use the admin login page" };
      }

      localStorage.setItem('firex_token', data.token);
      setToken(data.token);
      setUser(data.user);

      // Redirect depending on role
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/player/dashboard');
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Network connection error" };
    }
  };

  const register = async (name: string, email: string, password: string, inGameName?: string, inGameUid?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, inGameName, inGameUid })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || "Failed to register" };
      }

      localStorage.setItem('firex_token', data.token);
      setToken(data.token);
      setUser(data.user);
      navigate('/player/dashboard');

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Network connection error" };
    }
  };

  const logout = () => {
    localStorage.removeItem('firex_token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const updateWalletBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, walletBalance: newBalance });
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateWalletBalance, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

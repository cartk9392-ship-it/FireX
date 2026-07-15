import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public routes
import Landing from './pages/Landing';
import PlayerLogin from './pages/PlayerLogin';
import PlayerRegister from './pages/PlayerRegister';

// Layouts
import PlayerLayout from './layouts/PlayerLayout';
import AdminLayout from './layouts/AdminLayout';

// Player pages
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerProfile from './pages/PlayerProfile';
import JoinTournament from './pages/JoinTournament';
import MyTournaments from './pages/MyTournaments';
import PlayerWallet from './pages/PlayerWallet';
import PlayerNotifications from './pages/PlayerNotifications';
import PlayerSettings from './pages/PlayerSettings';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import TournamentManagement from './pages/TournamentManagement';
import MatchManagement from './pages/MatchManagement';
import PlayerManagement from './pages/PlayerManagement';
import WalletManagement from './pages/WalletManagement';
import PrizeDistribution from './pages/PrizeDistribution';
import AdminNotifications from './pages/AdminNotifications';
import SystemSettings from './pages/SystemSettings';

// 404 page
import NotFound from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PlayerLogin />} />
      <Route path="/register" element={<PlayerRegister />} />

      {/* Protected Player Routes */}
      <Route path="/player" element={<PlayerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PlayerDashboard />} />
        <Route path="profile" element={<PlayerProfile />} />
        <Route path="join" element={<JoinTournament />} />
        <Route path="my-tournaments" element={<MyTournaments />} />
        <Route path="wallet" element={<PlayerWallet />} />
        <Route path="notifications" element={<PlayerNotifications />} />
        <Route path="settings" element={<PlayerSettings />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="tournaments" element={<TournamentManagement />} />
        <Route path="matches" element={<MatchManagement />} />
        <Route path="players" element={<PlayerManagement />} />
        <Route path="wallet" element={<WalletManagement />} />
        <Route path="prizes" element={<PrizeDistribution />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* 404 Route */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { canAccess } from './data/accessMatrix';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import SPXPivots from './pages/SPXPivots';
import SPXBacktest from './pages/SPXBacktest';
import Placeholder from './pages/Placeholder';
import ChartView from './pages/ChartView';
import HistoricalPerformance from './pages/HistoricalPerformance';
import SubscriberCommentary from './pages/SubscriberCommentary';
import CommentaryHistory from './pages/CommentaryHistory';
import SetMarketSentiment from './pages/SetMarketSentiment';
import SentimentHistory from './pages/SentimentHistory';
import ManageUsers from './pages/ManageUsers';
import AddUser from './pages/AddUser';
import ManageApps from './pages/ManageApps';
import RegisterApp from './pages/RegisterApp';
import OpenMonitor from './pages/OpenMonitor';
import LogViewer from './pages/LogViewer';
import ContactInfo from './pages/ContactInfo';
import NotificationChannels from './pages/NotificationChannels';
import SPXTradeSettings from './pages/SPXTradeSettings';
import ManagePassword from './pages/ManagePassword';
import ManageRoles from './pages/ManageRoles';
import AddRole from './pages/AddRole';
import ManageAccess from './pages/ManageAccess';
import Login from './pages/Login';

function AuthGuard({ children }) {
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return children;
}

function Guard({ matrixKey, children }) {
  const { role, accessMatrix } = useAuth();
  if (!canAccess(accessMatrix, role, matrixKey)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
        <Route index element={<Home />} />

        {/* SPX Pivots */}
        <Route path="spx-pivots"         element={<SPXPivots />} />
        <Route path="spx-backtest"       element={<Guard matrixKey="apps/spx-backtest/run"><SPXBacktest /></Guard>} />
        <Route path="spx-pivots/history" element={<Guard matrixKey="apps/spx-pivots/history"><HistoricalPerformance /></Guard>} />
        <Route path="spx-pivots/charts"  element={<Guard matrixKey="apps/spx-pivots/chart-view"><ChartView /></Guard>} />

        {/* Admin — Market Sentiment */}
        <Route path="admin/commentary"         element={<Guard matrixKey="admin/market-sentiment/subscriber-commentary"><SubscriberCommentary /></Guard>} />
        <Route path="admin/sentiment"          element={<Guard matrixKey="admin/market-sentiment/set-market-sentiment"><SetMarketSentiment /></Guard>} />
        <Route path="admin/sentiment-history"  element={<Guard matrixKey="admin/market-sentiment/sentiment-history"><SentimentHistory /></Guard>} />
        <Route path="admin/commentary-history" element={<Guard matrixKey="admin/market-sentiment/commentary-history"><CommentaryHistory /></Guard>} />

        {/* Admin — User Mgmt */}
        <Route path="admin/users"     element={<Guard matrixKey="admin/user-mgmt/manage-users"><ManageUsers /></Guard>} />
        <Route path="admin/users/add" element={<Guard matrixKey="admin/user-mgmt/add-user"><AddUser /></Guard>} />

        {/* Admin — Access Group */}
        <Route path="admin/roles"     element={<Guard matrixKey="admin/access-group/manage-roles"><ManageRoles /></Guard>} />
        <Route path="admin/roles/add" element={<Guard matrixKey="admin/access-group/add-role"><AddRole /></Guard>} />
        <Route path="admin/access"    element={<Guard matrixKey="admin/access-group/manage-access"><ManageAccess /></Guard>} />

        {/* Admin — App Mgmt */}
        <Route path="admin/apps"          element={<Guard matrixKey="admin/app-mgmt/manage-apps"><ManageApps /></Guard>} />
        <Route path="admin/apps/register" element={<Guard matrixKey="admin/app-mgmt/register-app"><RegisterApp /></Guard>} />

        {/* System Monitor */}
        <Route path="system"      element={<Guard matrixKey="system-monitor/open-monitor"><OpenMonitor /></Guard>} />
        <Route path="system/logs" element={<Guard matrixKey="system-monitor/log-viewer"><LogViewer /></Guard>} />

        {/* Profile — all roles */}
        <Route path="profile/contact"        element={<ContactInfo />} />
        <Route path="profile/notifications"  element={<NotificationChannels />} />
        <Route path="profile/trade-settings" element={<SPXTradeSettings />} />
        <Route path="profile/password"       element={<ManagePassword />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

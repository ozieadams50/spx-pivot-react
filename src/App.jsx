import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import SPXPivots from './pages/SPXPivots';
import Placeholder from './pages/Placeholder';
import SubscriberCommentary from './pages/SubscriberCommentary';
import CommentaryHistory from './pages/CommentaryHistory';
import SetMarketSentiment from './pages/SetMarketSentiment';
import SentimentHistory from './pages/SentimentHistory';
import ManageUsers from './pages/ManageUsers';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />

          {/* SPX Pivots */}
          <Route path="spx-pivots" element={<SPXPivots />} />
          <Route path="spx-pivots/history" element={<Placeholder title="Historical Performance" description="SPX pivot level performance history and trade outcomes." />} />
          <Route path="spx-pivots/charts" element={<Placeholder title="Chart View" description="SPX price chart with pivot level overlays." />} />

          {/* Admin — Market Sentiment */}
          <Route path="admin/commentary" element={<SubscriberCommentary />} />
          <Route path="admin/sentiment" element={<SetMarketSentiment />} />
          <Route path="admin/sentiment-history" element={<SentimentHistory />} />
          <Route path="admin/commentary-history" element={<CommentaryHistory />} />

          {/* Admin — User Mgmt */}
          <Route path="admin/users" element={<ManageUsers />} />
          <Route path="admin/users/add" element={<Placeholder title="Add User" description="Register a new platform subscriber." />} />
          <Route path="admin/users/deactivate" element={<Placeholder title="Deactivate User" description="Suspend a subscriber's access." />} />
          <Route path="admin/users/delete" element={<Placeholder title="Delete User" description="Permanently remove a subscriber." />} />

          {/* Admin — App Mgmt */}
          <Route path="admin/apps" element={<Placeholder title="Manage App" description="Application configuration and settings." />} />
          <Route path="admin/apps/register" element={<Placeholder title="Register App" description="Register a new application in the platform." />} />
          <Route path="admin/apps/disable" element={<Placeholder title="Disable App" description="Disable an active application." />} />

          {/* System Monitor */}
          <Route path="system" element={<Placeholder title="System Monitor" description="Server health, cron jobs, and data pipeline status." />} />

          {/* Profile */}
          <Route path="profile/contact" element={<Placeholder title="Contact Info" />} />
          <Route path="profile/notifications" element={<Placeholder title="Notification Channels" description="Configure your ntfy topics and email preferences." />} />
          <Route path="profile/trade-settings" element={<Placeholder title="SPX Trade Settings" description="Set your trade style: Aggressive, Moderate, or Conservative." />} />
          <Route path="profile/password" element={<Placeholder title="Manage Password" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

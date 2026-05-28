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
import AddUser from './pages/AddUser';
import ManageApps from './pages/ManageApps';
import RegisterApp from './pages/RegisterApp';
import OpenMonitor from './pages/OpenMonitor';
import LogViewer from './pages/LogViewer';
import ContactInfo from './pages/ContactInfo';
import NotificationChannels from './pages/NotificationChannels';
import SPXTradeSettings from './pages/SPXTradeSettings';
import ManagePassword from './pages/ManagePassword';

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
          <Route path="admin/users/add" element={<AddUser />} />

          {/* Admin — App Mgmt */}
          <Route path="admin/apps" element={<ManageApps />} />
          <Route path="admin/apps/register" element={<RegisterApp />} />

          {/* System Monitor */}
          <Route path="system" element={<OpenMonitor />} />
          <Route path="system/logs" element={<LogViewer />} />

          {/* Profile */}
          <Route path="profile/contact"       element={<ContactInfo />} />
          <Route path="profile/notifications" element={<NotificationChannels />} />
          <Route path="profile/trade-settings" element={<SPXTradeSettings />} />
          <Route path="profile/password"      element={<ManagePassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

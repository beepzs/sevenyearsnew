import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastContainer } from './components/Toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Topics } from './pages/Topics';
import { TopicEdit } from './pages/TopicEdit';
import { Answers } from './pages/Answers';
import { AnswerEdit } from './pages/AnswerEdit';
import { FAQs } from './pages/FAQs';
import { Videos } from './pages/Videos';
import { VideoEdit } from './pages/VideoEdit';
import { YouTubeReports } from './pages/YouTubeReports';
import { Submissions } from './pages/Submissions';
import { Experts } from './pages/Experts';
import { ExpertEdit } from './pages/ExpertEdit';
import { PagesManagement } from './pages/PagesManagement';
import { PageEdit } from './pages/PageEdit';
import { Menus } from './pages/Menus';
import { Roles } from './pages/Roles';
import { Settings } from './pages/Settings';
import { BookManagement } from './pages/BookManagement';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAdmin();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="main-wrapper">
        <Topbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/new" element={<TopicEdit />} />
          <Route path="/topics/:slug/edit" element={<TopicEdit />} />
          <Route path="/answers" element={<Answers />} />
          <Route path="/answers/new" element={<AnswerEdit />} />
          <Route path="/answers/:slug/edit" element={<AnswerEdit />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/new" element={<VideoEdit />} />
          <Route path="/videos/:id/edit" element={<VideoEdit />} />
          <Route path="/youtube" element={<YouTubeReports />} />
          <Route path="/submissions" element={<Submissions />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/experts/new" element={<ExpertEdit />} />
          <Route path="/experts/:slug/edit" element={<ExpertEdit />} />
          <Route path="/pages" element={<PagesManagement />} />
          <Route path="/pages/new" element={<PageEdit />} />
          <Route path="/pages/:slug/edit" element={<PageEdit />} />
          <Route path="/book" element={<BookManagement />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AdminProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AdminProvider>
    </BrowserRouter>
  );
};

export default App;

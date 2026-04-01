import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import GoogleCalendarCallback from './pages/GoogleCalendarCallback';
import ClientPortalTasks from './pages/ClientPortalTasks';
import CalendarSync from './pages/CalendarSync';
import PerformanceReports from './pages/PerformanceReports';
import ClientPortalTimeline from './pages/ClientPortalTimeline';
import ClientPortalAccount from './pages/ClientPortalAccount';
import ClientPortalOnboarding from './pages/ClientPortalOnboarding';
import ClientPortalProject from './pages/ClientPortalProject';
import ClientPortalProjects from './pages/ClientPortalProjects';
import ClientPortalLogin from './pages/ClientPortalLogin';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="/GoogleCalendarCallback" element={<GoogleCalendarCallback />} />
        <Route path="/ClientPortalTasks" element={<ClientPortalTasks />} />
        <Route path="/CalendarSync" element={<CalendarSync />} />
        <Route path="/PerformanceReports" element={<PerformanceReports />} />
        <Route path="/ClientPortalTimeline" element={<ClientPortalTimeline />} />
        <Route path="/ClientPortalAccount" element={<ClientPortalAccount />} />
        <Route path="/ClientPortalOnboarding" element={<ClientPortalOnboarding />} />
        <Route path="/ClientPortalProject" element={<ClientPortalProject />} />
        <Route path="/ClientPortalProjects" element={<ClientPortalProjects />} />
        <Route path="/ClientPortalLogin" element={<ClientPortalLogin />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import GoogleCalendarCallback from './pages/GoogleCalendarCallback';
import ClientPortalTasks from './pages/ClientPortalTasks';
import ClientPortalTickets from './pages/ClientPortalTickets';
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
import ClientPortalLayout from './components/client-portal/ClientPortalLayout';
import ClientPortalDashboard from './pages/ClientPortalDashboard';
import ClientPortalDeliveries from './pages/ClientPortalDeliveries';
import ClientPortalCalendar from './pages/ClientPortalCalendar';
import ClientPortalFiles from './pages/ClientPortalFiles';
import ClientPortalSatisfaction from './pages/ClientPortalSatisfaction';
import ClientPortalActivate from './pages/ClientPortalActivate';
import ClientPortalAdmin from './pages/ClientPortalAdmin';
import WhatsAppNotifications from './pages/WhatsAppNotifications';
import ClientPortalEcommerceChecklist from './pages/ClientPortalEcommerceChecklist';
import ClientPortalFerramentas from './pages/ClientPortalFerramentas';
import ClientPortalDiagnostico from './pages/ClientPortalDiagnostico';
import ClientPortalCalculadoras from './pages/ClientPortalCalculadoras';
import ClientPortalKPIs from './pages/ClientPortalKPIs';
import ClientPortalPlanejadorTrafego from './pages/ClientPortalPlanejadorTrafego';
import ClientPortalUTMBuilder from './pages/ClientPortalUTMBuilder';
import Autenticar from './pages/Autenticar';
import ClientPortalFinancial from './pages/ClientPortalFinancial';
import ClientPortalCourses from './pages/ClientPortalCourses';
import PortalClienteLogin from './pages/PortalClienteLogin';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => {
  const content = children ?? <Outlet />;
  return Layout ? <Layout currentPageName={currentPageName}>{content}</Layout> : <>{content}</>;
};

const ClientPortalRoutes = () => (
  <Routes>
    <Route path="/PortalClienteLogin" element={<PortalClienteLogin />} />
    <Route path="/portalclienterlogin" element={<PortalClienteLogin />} />
    <Route path="/portalcliente" element={<PortalClienteLogin />} />
    <Route element={<ClientPortalLayout />}>
      <Route path="/ClientPortalLogin" element={<ClientPortalLogin />} />
      <Route path="/clientportallogin" element={<ClientPortalLogin />} />
      <Route path="/ClientPortalDashboard" element={<ClientPortalDashboard />} />
      <Route path="/clientportaldashboard" element={<ClientPortalDashboard />} />
      <Route path="/ClientPortalProjects" element={<ClientPortalProjects />} />
      <Route path="/clientportalprojects" element={<ClientPortalProjects />} />
      <Route path="/ClientPortalProject" element={<ClientPortalProject />} />
      <Route path="/clientportalproject" element={<ClientPortalProject />} />
      <Route path="/ClientPortalTasks" element={<ClientPortalTasks />} />
      <Route path="/clientportaltasks" element={<ClientPortalTasks />} />
      <Route path="/ClientPortalTimeline" element={<ClientPortalTimeline />} />
      <Route path="/clientportaltimeline" element={<ClientPortalTimeline />} />
      <Route path="/ClientPortalOnboarding" element={<ClientPortalOnboarding />} />
      <Route path="/clientportalonboarding" element={<ClientPortalOnboarding />} />
      <Route path="/ClientPortalAccount" element={<ClientPortalAccount />} />
      <Route path="/clientportalaccount" element={<ClientPortalAccount />} />
      <Route path="/ClientPortalDeliveries" element={<ClientPortalDeliveries />} />
      <Route path="/clientportaldeliveries" element={<ClientPortalDeliveries />} />
      <Route path="/ClientPortalCalendar" element={<ClientPortalCalendar />} />
      <Route path="/clientportalcalendar" element={<ClientPortalCalendar />} />
      <Route path="/ClientPortalFiles" element={<ClientPortalFiles />} />
      <Route path="/clientportalfiles" element={<ClientPortalFiles />} />
      <Route path="/ClientPortalSatisfaction" element={<ClientPortalSatisfaction />} />
      <Route path="/clientportalsatisfaction" element={<ClientPortalSatisfaction />} />
      <Route path="/ClientPortalActivate" element={<ClientPortalActivate />} />
      <Route path="/clientportalactivate" element={<ClientPortalActivate />} />
      <Route path="/ClientPortalTickets" element={<ClientPortalTickets />} />
      <Route path="/clientportaltickets" element={<ClientPortalTickets />} />
      <Route path="/ClientPortalFinancial" element={<ClientPortalFinancial />} />
      <Route path="/clientportalfinancial" element={<ClientPortalFinancial />} />
      <Route path="/ClientPortalCourses" element={<ClientPortalCourses />} />
      <Route path="/clientportalcourses" element={<ClientPortalCourses />} />
      <Route path="/ClientPortalEcommerceChecklist" element={<ClientPortalEcommerceChecklist />} />
      <Route path="/clientportalecommercechecklist" element={<ClientPortalEcommerceChecklist />} />
      <Route path="/ClientPortalFerramentas" element={<ClientPortalFerramentas />} />
      <Route path="/clientportalferramentas" element={<ClientPortalFerramentas />} />
      <Route path="/ClientPortalDiagnostico" element={<ClientPortalDiagnostico />} />
      <Route path="/clientportaldiagnostico" element={<ClientPortalDiagnostico />} />
      <Route path="/ClientPortalCalculadoras" element={<ClientPortalCalculadoras />} />
      <Route path="/clientportalcalculadoras" element={<ClientPortalCalculadoras />} />
      <Route path="/ClientPortalKPIs" element={<ClientPortalKPIs />} />
      <Route path="/clientportalkpis" element={<ClientPortalKPIs />} />
      <Route path="/ClientPortalPlanejadorTrafego" element={<ClientPortalPlanejadorTrafego />} />
      <Route path="/clientportalplanejadortrafego" element={<ClientPortalPlanejadorTrafego />} />
      <Route path="/ClientPortalUTMBuilder" element={<ClientPortalUTMBuilder />} />
      <Route path="/clientportalutmbuilder" element={<ClientPortalUTMBuilder />} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

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

  // Render the main app (internal Destra users only)
  return (
    <Routes>
      {/* ── App interno (com sidebar Layout) ── */}
      <Route element={<LayoutWrapper currentPageName={mainPageKey} />}>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages)
          .filter(([path]) => !path.startsWith("ClientPortal"))
          .map(([path, Page]) => (
            <Route key={path} path={`/${path}`} element={<Page />} />
          ))}
        <Route path="/GoogleCalendarCallback" element={<GoogleCalendarCallback />} />
        <Route path="/CalendarSync" element={<CalendarSync />} />
        <Route path="/PerformanceReports" element={<PerformanceReports />} />
        <Route path="/ClientPortalAdmin" element={<ClientPortalAdmin />} />
        <Route path="/clientportaladmin" element={<ClientPortalAdmin />} />
        <Route path="/WhatsAppNotifications" element={<WhatsAppNotifications />} />
        <Route path="/whatsappnotifications" element={<WhatsAppNotifications />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// Página de login unificada — fora do AuthenticatedApp para não exigir auth
const PublicRoutes = () => (
  <Routes>
    <Route path="/Autenticar" element={<Autenticar />} />
    <Route path="/autenticar" element={<Autenticar />} />
  </Routes>
);

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <NavigationTracker />
        <AppRouter />
      </Router>
      <Toaster />
      <VisualEditAgent />
    </QueryClientProvider>
  );
}

function AppRouter() {
  const location = useLocation();
  const pathLower = location.pathname.toLowerCase();
  const isPublicRoute = pathLower === '/autenticar';
  const isClientPortalRoute = pathLower.startsWith('/clientportal') && pathLower !== '/clientportaladmin';

  const isPortalLoginRoute = pathLower === '/portalclienterlogin' || pathLower === '/portalclientelogin' || pathLower === '/portalcliente';

  // Rotas completamente públicas — sem AuthProvider, sem verificação de auth
  if (isPublicRoute) return <Autenticar />;
  if (isPortalLoginRoute) return <PortalClienteLogin />;
  if (isClientPortalRoute) return <ClientPortalRoutes />;

  // Rotas internas — precisam do AuthProvider
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App
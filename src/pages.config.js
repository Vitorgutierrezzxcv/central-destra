/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Backlog from './pages/Backlog';
import ClientPortalAdmin from './pages/ClientPortalAdmin';
import ClientPortalCalendar from './pages/ClientPortalCalendar';
import ClientPortalDashboard from './pages/ClientPortalDashboard';
import ClientPortalDeliveries from './pages/ClientPortalDeliveries';
import ClientPortalFiles from './pages/ClientPortalFiles';
import ClientPortalOnboarding from './pages/ClientPortalOnboarding';
import ClientPortalProject from './pages/ClientPortalProject';
import ClientPortalSatisfaction from './pages/ClientPortalSatisfaction';
import ClientPortalTimeline from './pages/ClientPortalTimeline';
import Companies from './pages/Companies';
import Dashboard from './pages/Dashboard';
import FinanceFixedExpenses from './pages/FinanceFixedExpenses';
import FinancePayroll from './pages/FinancePayroll';
import FinanceSummary from './pages/FinanceSummary';
import FinanceVariableExpenses from './pages/FinanceVariableExpenses';
import Home from './pages/Home';
import Lancamentos from './pages/Lancamentos';
import Opportunities from './pages/Opportunities';
import Pages from './pages/Pages';
import PiermontDashboard from './pages/PiermontDashboard';
import PiermontExpenses from './pages/PiermontExpenses';
import PiermontInventory from './pages/PiermontInventory';
import PiermontProducts from './pages/PiermontProducts';
import PiermontSales from './pages/PiermontSales';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Prospecting from './pages/Prospecting';
import RecurringTasks from './pages/RecurringTasks';
import Tasks from './pages/Tasks';
import ClientPortalLogin from './pages/ClientPortalLogin';
import ClientPortalProjects from './pages/ClientPortalProjects';
import ClientPortalAccount from './pages/ClientPortalAccount';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Backlog": Backlog,
    "ClientPortalAdmin": ClientPortalAdmin,
    "ClientPortalCalendar": ClientPortalCalendar,
    "ClientPortalDashboard": ClientPortalDashboard,
    "ClientPortalDeliveries": ClientPortalDeliveries,
    "ClientPortalFiles": ClientPortalFiles,
    "ClientPortalOnboarding": ClientPortalOnboarding,
    "ClientPortalProject": ClientPortalProject,
    "ClientPortalSatisfaction": ClientPortalSatisfaction,
    "ClientPortalTimeline": ClientPortalTimeline,
    "Companies": Companies,
    "Dashboard": Dashboard,
    "FinanceFixedExpenses": FinanceFixedExpenses,
    "FinancePayroll": FinancePayroll,
    "FinanceSummary": FinanceSummary,
    "FinanceVariableExpenses": FinanceVariableExpenses,
    "Home": Home,
    "Lancamentos": Lancamentos,
    "Opportunities": Opportunities,
    "Pages": Pages,
    "PiermontDashboard": PiermontDashboard,
    "PiermontExpenses": PiermontExpenses,
    "PiermontInventory": PiermontInventory,
    "PiermontProducts": PiermontProducts,
    "PiermontSales": PiermontSales,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Prospecting": Prospecting,
    "RecurringTasks": RecurringTasks,
    "Tasks": Tasks,
    "ClientPortalLogin": ClientPortalLogin,
    "ClientPortalProjects": ClientPortalProjects,
    "ClientPortalAccount": ClientPortalAccount,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
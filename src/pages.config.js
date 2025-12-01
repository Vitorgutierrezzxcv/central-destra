import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import ProjectDetail from './pages/ProjectDetail';
import Backlog from './pages/Backlog';
import Companies from './pages/Companies';
import Opportunities from './pages/Opportunities';
import Lancamentos from './pages/Lancamentos';
import Prospecting from './pages/Prospecting';
import RecurringTasks from './pages/RecurringTasks';
import FinanceFixedExpenses from './pages/FinanceFixedExpenses';
import FinanceVariableExpenses from './pages/FinanceVariableExpenses';
import FinancePayroll from './pages/FinancePayroll';
import FinanceSummary from './pages/FinanceSummary';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Tasks": Tasks,
    "ProjectDetail": ProjectDetail,
    "Backlog": Backlog,
    "Companies": Companies,
    "Opportunities": Opportunities,
    "Lancamentos": Lancamentos,
    "Prospecting": Prospecting,
    "RecurringTasks": RecurringTasks,
    "FinanceFixedExpenses": FinanceFixedExpenses,
    "FinanceVariableExpenses": FinanceVariableExpenses,
    "FinancePayroll": FinancePayroll,
    "FinanceSummary": FinanceSummary,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
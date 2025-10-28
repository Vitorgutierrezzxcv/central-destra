import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import ProjectDetail from './pages/ProjectDetail';
import Backlog from './pages/Backlog';
import Companies from './pages/Companies';
import Opportunities from './pages/Opportunities';
import Lancamentos from './pages/Lancamentos';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Tasks": Tasks,
    "ProjectDetail": ProjectDetail,
    "Backlog": Backlog,
    "Companies": Companies,
    "Opportunities": Opportunities,
    "Lancamentos": Lancamentos,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};
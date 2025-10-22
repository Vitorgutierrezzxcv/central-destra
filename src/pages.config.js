import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import ProjectDetail from './pages/ProjectDetail';
import Backlog from './pages/Backlog';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Tasks": Tasks,
    "ProjectDetail": ProjectDetail,
    "Backlog": Backlog,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};
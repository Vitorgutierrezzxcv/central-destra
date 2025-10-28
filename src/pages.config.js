import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Backlog from "./pages/Backlog";
import Companies from "./pages/Companies";
import ProjectDetail from "./pages/ProjectDetail";
import Opportunities from "./pages/Opportunities";
import Lancamentos from "./pages/Lancamentos";
import ModuleDetail from "./pages/ModuleDetail";

const pages = [
  { name: "Dashboard", component: Dashboard },
  { name: "Projects", component: Projects },
  { name: "Tasks", component: Tasks },
  { name: "Backlog", component: Backlog },
  { name: "Companies", component: Companies },
  { name: "ProjectDetail", component: ProjectDetail },
  { name: "Opportunities", component: Opportunities },
  { name: "Lancamentos", component: Lancamentos },
  { name: "ModuleDetail", component: ModuleDetail },
];

export const pagesConfig = pages;
export default pages;
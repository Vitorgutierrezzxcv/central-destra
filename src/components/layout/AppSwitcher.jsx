import React, { useState } from "react";
import {
  FolderKanban, Users, ChevronDown, Grid3x3,
  Wallet, Target, FileText, Store, Building2, Check
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUserAccess } from "./AccessGuard";

const allModules = [
  {
    id: "taskflow",
    name: "TaskFlow",
    description: "Projetos e Tarefas",
    icon: FolderKanban,
    defaultPage: "Dashboard",
    pages: ["Dashboard", "Projects", "Tasks", "Backlog", "ProjectDetail"]
  },
  {
    id: "crm",
    name: "CRM",
    description: "Clientes e Vendas",
    icon: Users,
    defaultPage: "Companies",
    pages: ["Companies", "Opportunities"]
  },
  {
    id: "finance",
    name: "Finanças",
    description: "Controle Financeiro",
    icon: Wallet,
    defaultPage: "FinanceDashboard",
    pages: ["FinanceDashboard", "FinanceEntries", "FinanceAccounts", "FinanceCashFlow", "FinanceRecurrences", "FinanceReports", "FinanceMonthlyClosing", "Lancamentos", "FinanceFixedExpenses", "FinanceVariableExpenses", "FinancePayroll", "FinanceSummary"]
  },
  {
    id: "prospecting",
    name: "Prospecção",
    description: "Social Selling",
    icon: Target,
    defaultPage: "Prospecting",
    pages: ["Prospecting"]
  },
  {
    id: "pages",
    name: "Páginas",
    description: "Wiki e Documentação",
    icon: FileText,
    defaultPage: "Pages",
    pages: ["Pages"]
  },
  {
    id: "piermont",
    name: "Piermont",
    description: "E-commerce",
    icon: Store,
    defaultPage: "PiermontDashboard",
    pages: ["PiermontDashboard", "PiermontProducts", "PiermontSales", "PiermontExpenses", "PiermontInventory"]
  },
  {
    id: "client_portal_admin",
    name: "Central do Cliente",
    description: "Portal e acompanhamento",
    icon: Building2,
    defaultPage: "ClientPortalAdmin",
    pages: ["ClientPortalAdmin", "ClientPortalDashboard", "ClientPortalProject", "ClientPortalDeliveries", "ClientPortalOnboarding", "ClientPortalCalendar", "ClientPortalFiles", "ClientPortalSatisfaction", "ClientPortalTimeline", "ClientPortalProjects", "ClientPortalAccount", "ClientPortalLogin"]
  }
];

export default function AppSwitcher({ isMobile = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { canAccess } = useUserAccess();

  const modules = allModules.filter(module => canAccess(module.id));

  const getCurrentModule = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('clientportal'))              return modules.find(m => m.id === 'client_portal_admin');
    if (path.includes('pages'))                     return modules.find(m => m.id === 'pages');
    if (path.includes('prospecting'))               return modules.find(m => m.id === 'prospecting');
    if (path.includes('companies') || path.includes('opportunit')) return modules.find(m => m.id === 'crm');
    if (path.includes('lancamentos') || path.includes('finance'))  return modules.find(m => m.id === 'finance');
    if (path.includes('piermont'))                  return modules.find(m => m.id === 'piermont');
    return modules.find(m => m.id === 'taskflow') || modules[0];
  };

  const activeModule = getCurrentModule();
  if (!activeModule) return null;
  const ActiveIcon = activeModule.icon;

  const handleModuleClick = (module) => {
    if (module.id !== activeModule.id) navigate(createPageUrl(module.defaultPage));
    setShowDialog(false);
  };

  if (isMobile) {
    return (
      <>
        {modules.map(module => {
          const Icon = module.icon;
          const isActive = module.id === activeModule.id;
          return (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive ? 'bg-[#131A20]' : 'bg-[#EAEAEA] hover:bg-[#6FA6FF]/20'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#456C8D]'}`} />
            </button>
          );
        })}
      </>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2.5 w-full hover:bg-[#F8F9FB] p-2.5 rounded-lg transition-colors group"
      >
        <div className="w-8 h-8 bg-[#131A20] rounded-lg flex items-center justify-center flex-shrink-0">
          <ActiveIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-normal text-[#131A20] leading-tight truncate">{activeModule.name}</p>
          <p className="text-[10px] text-[#456C8D] font-light truncate">{activeModule.description}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#456C8D] flex-shrink-0" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm bg-white border border-[#EAEAEA] rounded-xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#EAEAEA]">
            <DialogTitle className="text-base font-normal text-[#131A20]">Módulos</DialogTitle>
            <p className="text-xs text-[#456C8D] font-light">Navegue entre as áreas do sistema</p>
          </DialogHeader>
          <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
            {modules.map(module => {
              const Icon = module.icon;
              const isActive = module.id === activeModule.id;
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    isActive ? 'bg-[#F8F9FB] border border-[#6FA6FF]/20' : 'hover:bg-[#F8F9FB] border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-[#131A20]' : 'bg-[#EAEAEA]'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#456C8D]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-[#131A20]">{module.name}</p>
                    <p className="text-xs text-[#456C8D] font-light">{module.description}</p>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-[#6FA6FF] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
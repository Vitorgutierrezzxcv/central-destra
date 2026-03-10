import React, { useState } from "react";
import { 
  Check, 
  FolderKanban, 
  Users, 
  ChevronDown,
  Grid3x3,
  Wallet,
  Target,
  FileText,
  Store,
  Building2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUserAccess } from "./AccessGuard";

const allModules = [
  {
    id: "taskflow",
    name: "TaskFlow",
    description: "Gestão de Projetos e Tarefas",
    icon: FolderKanban,
    color: "bg-[#6FA6FF]",
    defaultPage: "Dashboard",
    pages: ["Dashboard", "Projects", "Tasks", "Backlog", "ProjectDetail"]
  },
  {
    id: "crm",
    name: "CRM",
    description: "Gestão de Clientes e Vendas",
    icon: Users,
    color: "bg-[#456C8D]",
    defaultPage: "Companies",
    pages: ["Companies", "Opportunities"]
  },
  {
    id: "finance",
    name: "Finanças",
    description: "Controle Financeiro",
    icon: Wallet,
    color: "bg-[#131A20]",
    defaultPage: "Lancamentos",
    pages: ["Lancamentos", "FinanceFixedExpenses", "FinanceVariableExpenses", "FinancePayroll", "FinanceSummary"]
  },
  {
    id: "prospecting",
    name: "Prospecção",
    description: "Métricas de Social Selling",
    icon: Target,
    color: "bg-[#6FA6FF]",
    defaultPage: "Prospecting",
    pages: ["Prospecting"]
  },
  {
    id: "pages",
    name: "Páginas",
    description: "Wiki e Documentação",
    icon: FileText,
    color: "bg-indigo-600",
    defaultPage: "Pages",
    pages: ["Pages"]
  },
  {
    id: "piermont",
    name: "Piermont",
    description: "E-commerce completo",
    icon: Store,
    color: "bg-black",
    defaultPage: "PiermontDashboard",
    pages: ["PiermontDashboard", "PiermontProducts", "PiermontSales", "PiermontExpenses", "PiermontInventory"]
  },
  {
    id: "client_portal_admin",
    name: "Central do Cliente",
    description: "Portal e acompanhamento",
    icon: Building2,
    color: "bg-blue-700",
    defaultPage: "ClientPortalAdmin",
    pages: ["ClientPortalAdmin", "ClientPortalDashboard", "ClientPortalProject", "ClientPortalDeliveries", "ClientPortalOnboarding", "ClientPortalCalendar", "ClientPortalFiles", "ClientPortalSatisfaction", "ClientPortalTimeline"]
  }
];

export default function AppSwitcher({ isMobile = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccess, hasFullAccess } = useUserAccess();

  // Filter modules based on user access
  const modules = allModules.filter(module => canAccess(module.id));

  // Determine active module based on current page
  const getCurrentModule = () => {
    const currentPath = location.pathname.toLowerCase();
    
    if (currentPath.includes('clientportal')) {
      return modules.find(m => m.id === 'client_portal_admin');
    }
    if (currentPath.includes('pages')) {
      return modules.find(m => m.id === 'pages');
    }
    if (currentPath.includes('prospecting')) {
      return modules.find(m => m.id === 'prospecting');
    }
    if (currentPath.includes('companies') || currentPath.includes('opportunities')) {
      return modules.find(m => m.id === 'crm');
    }
    if (currentPath.includes('lancamentos') || 
        currentPath.includes('financefixedexpenses') || 
        currentPath.includes('financevariableexpenses') || 
        currentPath.includes('financepayroll') || 
        currentPath.includes('financesummary')) {
      return modules.find(m => m.id === 'finance');
    }
    if (currentPath.includes('piermont')) {
      return modules.find(m => m.id === 'piermont');
    }
    
    return modules.find(m => m.id === 'taskflow') || modules[0];
  };

  const activeModule = getCurrentModule();
  const ActiveIcon = activeModule.icon;

  const handleModuleClick = (module) => {
    if (module.id !== activeModule.id) {
      navigate(createPageUrl(module.defaultPage));
      setShowDialog(false);
    } else {
      setShowDialog(false);
    }
  };

  const ModuleCard = ({ module }) => {
    const Icon = module.icon;
    const isActive = module.id === activeModule.id;
    
    return (
      <button
        onClick={() => handleModuleClick(module)}
        className={`
          relative w-full p-3 rounded-xl border transition-all text-left
          ${isActive 
            ? 'border-[#6FA6FF] bg-[#6FA6FF]/5' 
            : 'border-[#EAEAEA] hover:border-[#6FA6FF]/50 bg-white'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${module.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[#131A20] text-sm">{module.name}</h3>
              {isActive && (
                <Badge className="bg-[#6FA6FF] text-white border-none text-[10px] px-1.5 py-0">
                  <Check className="w-2.5 h-2.5 mr-0.5" />
                  Ativo
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#456C8D] truncate">{module.description}</p>
          </div>
        </div>
      </button>
    );
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
              className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all
                ${isActive 
                  ? `${module.color} shadow-md scale-110` 
                  : 'bg-[#EAEAEA] hover:bg-[#6FA6FF]/20'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#456C8D]'}`} />
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
        className="flex items-center gap-3 w-full hover:bg-[#EAEAEA] p-3 rounded-xl transition-all group border border-[#EAEAEA] bg-white"
      >
        <div className={`w-10 h-10 ${activeModule.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <ActiveIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h2 className="font-medium text-[#131A20] text-sm leading-tight">{activeModule.name}</h2>
          <p className="text-xs text-[#456C8D] truncate">{activeModule.description}</p>
        </div>
        <ChevronDown className="w-5 h-5 text-[#456C8D] group-hover:text-[#131A20] transition-colors flex-shrink-0" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-white border border-[#EAEAEA]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#131A20]">Escolha um Módulo</DialogTitle>
            <DialogDescription className="text-[#456C8D]">
              Alterne entre diferentes áreas do sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {modules.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { 
  Check, 
  FolderKanban, 
  Users, 
  ChevronDown,
  Grid3x3,
  Wallet,
  Target
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
    color: "from-blue-500 to-purple-600",
    defaultPage: "Dashboard",
    pages: ["Dashboard", "Projects", "Tasks", "Backlog", "ProjectDetail"]
  },
  {
    id: "crm",
    name: "CRM",
    description: "Gestão de Clientes e Vendas",
    icon: Users,
    color: "from-green-500 to-teal-600",
    defaultPage: "Companies",
    pages: ["Companies", "Opportunities"]
  },
  {
    id: "finance",
    name: "Finanças",
    description: "Controle Financeiro",
    icon: Wallet,
    color: "from-amber-500 to-orange-600",
    defaultPage: "Lancamentos",
    pages: ["Lancamentos"]
  },
  {
    id: "prospecting",
    name: "Prospecção",
    description: "Métricas de Social Selling",
    icon: Target,
    color: "from-cyan-500 to-blue-600",
    defaultPage: "Prospecting",
    pages: ["Prospecting"]
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
    
    // Check if in Prospecting pages
    if (currentPath.includes('prospecting')) {
      return modules.find(m => m.id === 'prospecting');
    }
    
    // Check if in CRM pages
    if (currentPath.includes('companies') || currentPath.includes('opportunities')) {
      return modules.find(m => m.id === 'crm');
    }
    
    // Check if in Finance pages
    if (currentPath.includes('lancamentos')) {
      return modules.find(m => m.id === 'finance');
    }
    
    // Default to TaskFlow or first available
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
          relative w-full p-3 rounded-xl border-2 transition-all text-left
          ${isActive 
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">{module.name}</h3>
              {isActive && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-none text-[10px] px-1.5 py-0">
                  <Check className="w-2.5 h-2.5 mr-0.5" />
                  Ativo
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 truncate">{module.description}</p>
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
                  ? `bg-gradient-to-br ${module.color} shadow-lg scale-110` 
                  : 'bg-slate-100 hover:bg-slate-200'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
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
        className="flex items-center gap-3 w-full hover:bg-slate-50 p-3 rounded-xl transition-all group border border-slate-200 hover:border-slate-300 bg-white shadow-sm hover:shadow-md"
      >
        <div className={`w-10 h-10 bg-gradient-to-br ${activeModule.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <ActiveIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h2 className="font-bold text-slate-900 text-sm leading-tight">{activeModule.name}</h2>
          <p className="text-xs text-slate-500 truncate">{activeModule.description}</p>
        </div>
        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Escolha um Módulo</DialogTitle>
            <DialogDescription>
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
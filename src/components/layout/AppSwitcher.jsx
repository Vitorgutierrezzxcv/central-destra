import React, { useState } from "react";
import { 
  Check, 
  FolderKanban, 
  Users, 
  ChevronDown,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const modules = [
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
    pages: ["Companies"]
  }
];

export default function AppSwitcher({ isMobile = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active module based on current page
  const getCurrentModule = () => {
    const currentPath = location.pathname.split('/').pop();
    return modules.find(m => m.pages.some(page => 
      createPageUrl(page).includes(currentPath)
    )) || modules[0];
  };

  const activeModule = getCurrentModule();
  const ActiveIcon = activeModule.icon;

  const handleModuleClick = (module) => {
    if (module.id !== activeModule.id) {
      navigate(createPageUrl(module.defaultPage));
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
          relative w-full p-4 rounded-xl border-2 transition-all text-left
          ${isActive 
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
          }
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900">{module.name}</h3>
              {isActive && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-none text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600">{module.description}</p>
          </div>
        </div>
      </button>
    );
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className={`w-8 h-8 bg-gradient-to-br ${activeModule.color} rounded-lg flex items-center justify-center shadow-md`}>
            <ActiveIcon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{activeModule.name}</h1>
            <ChevronDown className="w-3 h-3 text-slate-500 inline" />
          </div>
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
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full hover:bg-slate-50 p-2 rounded-lg transition-colors">
            <div className={`w-10 h-10 bg-gradient-to-br ${activeModule.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <ActiveIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="font-bold text-slate-900 text-lg leading-tight">{activeModule.name}</h2>
              <p className="text-xs text-slate-500">{activeModule.description.split(' ').slice(0, 3).join(' ')}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Módulos Disponíveis
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2 space-y-2">
            {modules.map(module => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
import React, { useState } from "react";
import { 
  Check, 
  FolderKanban, 
  Users, 
  ChevronDown,
  Lock,
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const modules = [
  {
    id: "taskflow",
    name: "TaskFlow",
    description: "Gestão de Projetos e Tarefas",
    icon: FolderKanban,
    color: "from-blue-500 to-purple-600",
    active: true,
    available: true
  },
  {
    id: "crm",
    name: "CRM",
    description: "Gestão de Clientes e Vendas",
    icon: Users,
    color: "from-green-500 to-teal-600",
    active: false,
    available: false,
    comingSoon: true
  }
];

export default function AppSwitcher({ isMobile = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const activeModule = modules.find(m => m.active);
  const ActiveIcon = activeModule.icon;

  const ModuleCard = ({ module }) => {
    const Icon = module.icon;
    
    return (
      <button
        onClick={() => {
          if (module.available) {
            setShowDialog(false);
          }
        }}
        disabled={!module.available}
        className={`
          relative w-full p-4 rounded-xl border-2 transition-all text-left
          ${module.active 
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
            : module.available
              ? 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white'
              : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
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
              {module.active && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-none text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              )}
              {module.comingSoon && (
                <Badge variant="outline" className="bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 border-orange-200 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Em Breve
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600">{module.description}</p>
          </div>
          {!module.available && (
            <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
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
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
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
              <p className="text-xs text-slate-500">Gestão de Projetos</p>
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
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FolderKanban, ListTodo, Package, Building2 } from "lucide-react";

const tabs = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { label: "Projetos", icon: FolderKanban, page: "Projects" },
  { label: "Tarefas", icon: ListTodo, page: "Tasks" },
  { label: "Backlog", icon: Package, page: "Backlog" },
  { label: "Clientes", icon: Building2, page: "Companies" },
];

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 bottom-tab-bar md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const url = createPageUrl(tab.page);
          const isActive = location.pathname === url;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.page}
              to={url}
              className={`
                tab-bar-item flex flex-col items-center justify-center
                min-w-[44px] min-h-[44px] px-2 py-1 rounded-xl
                transition-all duration-150
                ${isActive
                  ? "text-blue-600"
                  : "text-slate-400 active:text-slate-600"
                }
              `}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] mt-0.5 font-medium leading-none ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-600" style={{ marginBottom: "env(safe-area-inset-bottom, 6px)" }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
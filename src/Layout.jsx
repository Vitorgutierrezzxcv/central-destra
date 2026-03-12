import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ListTodo, LayoutDashboard, Plus, Package, Building2, ChevronDown, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import UserProfile from "./components/layout/UserProfile";
import AppSwitcher from "./components/layout/AppSwitcher";

const taskFlowNav = [
  { title: "Visão Geral", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Projetos",    url: createPageUrl("Projects"),  icon: FolderKanban },
  { title: "Tarefas",     url: createPageUrl("Tasks"),     icon: ListTodo },
  { title: "Backlog",     url: createPageUrl("Backlog"),   icon: Package },
];

const crmNav = [
  { title: "Empresas", url: createPageUrl("Companies"), icon: Building2 },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isTaskFlowOpen, setIsTaskFlowOpen] = useState(true);
  const isInCRM = location.pathname.toLowerCase().includes('companies') || location.pathname.toLowerCase().includes('opportunit');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F7F7F7]">
        {/* ── Sidebar ─────────────────────────────── */}
        <Sidebar className="border-r border-[#EAEAEA] bg-white hidden md:flex">
          <SidebarContent className="px-3 py-4 flex flex-col h-full gap-0">

            {/* App Brand / Module Switcher */}
            <div className="px-2 mb-5">
              <AppSwitcher />
            </div>

            {/* Nav */}
            <SidebarGroup className="flex-1 p-0">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {!isInCRM ? (
                    <Collapsible open={isTaskFlowOpen} onOpenChange={setIsTaskFlowOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors group mb-0.5">
                          <div className="flex items-center gap-2.5">
                            <FolderKanban className="w-4 h-4 text-[#456C8D]" />
                            <span className="text-sm font-normal text-[#131A20]">TaskFlow</span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-[#456C8D] transition-transform duration-200 ${isTaskFlowOpen ? '' : '-rotate-90'}`} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-3 space-y-0.5">
                        {taskFlowNav.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton asChild className="p-0 h-auto">
                                <Link
                                  to={item.url}
                                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 ${
                                    isActive
                                      ? 'bg-[#131A20] text-white font-normal'
                                      : 'text-[#456C8D] hover:text-[#131A20] hover:bg-[#F7F7F7] font-light'
                                  }`}
                                >
                                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                  {item.title}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    crmNav.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild className="p-0 h-auto">
                            <Link
                              to={item.url}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 ${
                                isActive
                                  ? 'bg-[#131A20] text-white font-normal'
                                  : 'text-[#456C8D] hover:text-[#131A20] hover:bg-[#F7F7F7] font-light'
                              }`}
                            >
                              <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              {item.title}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Bottom: User */}
            <div className="pt-3 border-t border-[#EAEAEA]">
              <UserProfile />
            </div>
          </SidebarContent>
        </Sidebar>

        {/* ── Main ──────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="bg-white border-b border-[#EAEAEA] px-4 py-3 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-3">
              <SidebarTrigger className="w-9 h-9 flex items-center justify-center hover:bg-[#F7F7F7] rounded-xl transition-colors" />
              <AppSwitcher isMobile={true} />
              <div className="w-9" />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
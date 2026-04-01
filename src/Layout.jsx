import React from "react";
import { Outlet } from "react-router-dom";
import FloatingMenu from "./components/layout/FloatingMenu";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1">
        {children ?? <Outlet />}
      </div>
      <FloatingMenu />
    </div>
  );
}
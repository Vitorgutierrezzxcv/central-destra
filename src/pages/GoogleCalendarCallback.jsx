import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function GoogleCalendarCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      setStatus("error");
      setTimeout(() => navigate(createPageUrl("Dashboard")), 2000);
      return;
    }

    const redirectUri = `${window.location.origin}/GoogleCalendarCallback`;
    base44.functions.invoke("googleCalendarCallback", { code, redirect_uri: redirectUri })
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate(createPageUrl("Dashboard")), 1500);
      })
      .catch(() => {
        setStatus("error");
        setTimeout(() => navigate(createPageUrl("Dashboard")), 2000);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-4 border-[#EAEAEA] border-t-[#6FA6FF] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-light text-[#456C8D]">Conectando seu Google Calendar...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <p className="text-sm font-normal text-[#131A20]">Google Calendar conectado!</p>
            <p className="text-xs font-light text-[#456C8D] mt-1">Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-lg">✕</span>
            </div>
            <p className="text-sm font-normal text-[#131A20]">Erro ao conectar</p>
            <p className="text-xs font-light text-[#456C8D] mt-1">Redirecionando...</p>
          </>
        )}
      </div>
    </div>
  );
}
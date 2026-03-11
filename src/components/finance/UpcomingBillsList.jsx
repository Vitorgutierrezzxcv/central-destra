import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function UpcomingBillsList({ entries, overdue }) {
  const all = [...(overdue || []).map(e => ({ ...e, _overdue: true })), ...(entries || [])];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          Vencimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {all.length === 0 && (
          <p className="text-slate-400 text-sm">Nenhum vencimento próximo.</p>
        )}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {all.map(e => (
            <div key={e.id} className={`flex items-center justify-between p-3 rounded-lg ${e._overdue ? "bg-red-50 border border-red-100" : "bg-slate-50"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{e.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {e._overdue && (
                    <Badge className="bg-red-100 text-red-700 border-none text-xs px-1.5 py-0">Vencido</Badge>
                  )}
                  <span className="text-xs text-slate-500">
                    {e.due_date ? format(parseISO(e.due_date), "dd/MM", { locale: ptBR }) : "—"}
                  </span>
                  {e.category && <span className="text-xs text-slate-400">{e.category}</span>}
                </div>
              </div>
              <span className={`font-bold text-sm ml-3 ${e.type === "revenue" ? "text-emerald-600" : "text-red-600"}`}>
                {e.type === "revenue" ? "+" : "-"}{fmt(e.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
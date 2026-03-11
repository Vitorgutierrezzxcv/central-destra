import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, isAfter, isBefore, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock, CheckCircle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS = {
  open: { label: "Aberto", color: "bg-blue-100 text-blue-700", icon: Clock },
  reviewing: { label: "Em revisão", color: "bg-amber-100 text-amber-700", icon: Clock },
  closed: { label: "Fechado", color: "bg-emerald-100 text-emerald-700", icon: Lock },
};

export default function FinanceMonthlyClosing() {
  const [showClose, setShowClose] = useState(null);
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  const { data: closings = [] } = useQuery({
    queryKey: ["monthly_closings"],
    queryFn: () => base44.entities.MonthlyClosing.list("-reference_month"),
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["financial_entries"],
    queryFn: () => base44.entities.FinancialEntry.list("-created_date", 1000),
  });
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => d.id ? base44.entities.MonthlyClosing.update(d.id, d) : base44.entities.MonthlyClosing.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["monthly_closings"] }); setShowClose(null); setNotes(""); },
  });

  // Generate last 12 months list
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i + 1);
    return format(d, "yyyy-MM");
  });

  const getMonthData = (ym) => {
    const start = startOfMonth(parseISO(ym + "-01"));
    const end = endOfMonth(parseISO(ym + "-01"));
    const monthEntries = entries.filter(e => {
      const ref = e.competence_date || e.due_date;
      if (!ref) return false;
      const d = parseISO(ref);
      return !isBefore(d, start) && !isAfter(d, end);
    });
    const revenue = monthEntries.filter(e => e.type === "revenue").reduce((s, e) => s + (e.amount || 0), 0);
    const expense = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + (e.amount || 0), 0);
    return { revenue, expense, balance: revenue - expense, count: monthEntries.length };
  };

  const handleClose = (ym) => {
    const existing = closings.find(c => c.reference_month === ym);
    const monthData = getMonthData(ym);
    const data = {
      ...(existing || {}),
      reference_month: ym,
      total_revenue: monthData.revenue,
      total_expense: monthData.expense,
      closing_balance: monthData.balance,
      status: "closed",
      notes,
      closed_by: user?.email || "",
      closed_at: new Date().toISOString(),
    };
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fechamento Mensal</h1>
          <p className="text-slate-500 text-sm">Registre e trave os meses fechados</p>
        </div>

        <div className="space-y-3">
          {months.map(ym => {
            const closing = closings.find(c => c.reference_month === ym);
            const monthData = getMonthData(ym);
            const status = closing ? STATUS[closing.status] : STATUS.open;
            const StatusIcon = status.icon;
            const isClosed = closing?.status === "closed";

            return (
              <Card key={ym} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClosed ? "bg-emerald-100" : "bg-slate-100"}`}>
                        <StatusIcon className={`w-5 h-5 ${isClosed ? "text-emerald-600" : "text-slate-500"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 capitalize">
                          {format(parseISO(ym + "-01"), "MMMM yyyy", { locale: ptBR })}
                        </p>
                        {isClosed && closing.closed_at && (
                          <p className="text-xs text-slate-400">
                            Fechado em {format(parseISO(closing.closed_at), "dd/MM/yyyy 'às' HH:mm")}
                            {closing.closed_by && ` por ${closing.closed_by}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Receitas</p>
                        <p className="font-medium text-emerald-600">{fmt(closing?.total_revenue ?? monthData.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Despesas</p>
                        <p className="font-medium text-red-500">{fmt(closing?.total_expense ?? monthData.expense)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Resultado</p>
                        <p className={`font-bold ${(closing?.closing_balance ?? monthData.balance) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {fmt(closing?.closing_balance ?? monthData.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={`${status.color} border-none`}>{status.label}</Badge>
                      {!isClosed && (
                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800"
                          onClick={() => setShowClose(ym)}
                        >
                          <Lock className="w-3.5 h-3.5 mr-1" />
                          Fechar Mês
                        </Button>
                      )}
                    </div>
                  </div>

                  {closing?.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 italic">{closing.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {showClose && (
        <Dialog open onOpenChange={() => setShowClose(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Fechar Mês — {format(parseISO(showClose + "-01"), "MMMM yyyy", { locale: ptBR })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {(() => {
                const d = getMonthData(showClose);
                return (
                  <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Receitas</p>
                      <p className="font-bold text-emerald-600">{fmt(d.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Despesas</p>
                      <p className="font-bold text-red-500">{fmt(d.expense)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Resultado</p>
                      <p className={`font-bold ${d.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(d.balance)}</p>
                    </div>
                  </div>
                );
              })()}
              <div>
                <Label className="text-xs mb-1 block">Observações do fechamento</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas do período..." />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowClose(null)}>Cancelar</Button>
                <Button
                  className="bg-slate-900 hover:bg-slate-800"
                  onClick={() => handleClose(showClose)}
                  disabled={saveMutation.isPending}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Confirmar Fechamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
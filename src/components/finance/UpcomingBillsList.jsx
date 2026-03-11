import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function UpcomingBillsList({ entries, overdue }) {
  const all = [
    ...(overdue || []).map(e => ({ ...e, _overdue: true })),
    ...(entries || [])
  ];

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-[#EAEAEA] rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#131A20]" />
        </div>
        <div>
          <h3 className="text-sm font-normal text-[#131A20]">Vencimentos</h3>
          <p className="text-xs text-[#456C8D] font-light">Próximos 7 dias</p>
        </div>
      </div>

      {all.length === 0 ? (
        <p className="text-sm text-[#456C8D] font-light py-4 text-center">Nenhum vencimento próximo</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {all.map(e => (
            <div
              key={e.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                e._overdue
                  ? 'border-[#FEF0EE] bg-[#FEF0EE]'
                  : 'border-[#EAEAEA] bg-[#F8F9FB]'
              }`}
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-normal text-[#131A20] truncate">{e.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {e._overdue && (
                    <span className="text-[10px] font-normal text-[#C0392B] flex items-center gap-0.5">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Vencido
                    </span>
                  )}
                  <span className="text-xs text-[#456C8D] font-light">
                    {e.due_date ? format(parseISO(e.due_date), "dd/MM", { locale: ptBR }) : "—"}
                  </span>
                  {e.category && (
                    <span className="text-[10px] text-[#456C8D] font-light">{e.category}</span>
                  )}
                </div>
              </div>
              <span className={`text-sm font-normal flex-shrink-0 ${e.type === 'revenue' ? 'text-[#2D6A4F]' : 'text-[#C0392B]'}`}>
                {e.type === 'revenue' ? '+' : '-'}{fmt(e.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
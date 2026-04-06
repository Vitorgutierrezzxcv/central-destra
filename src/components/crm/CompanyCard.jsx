import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Building2, Calendar, DollarSign, Phone, Mail, FolderKanban } from "lucide-react";

const statusConfig = {
  lead: { label: "Lead", color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]" },
  client: { label: "Cliente", color: "bg-[#6FA6FF]/20 text-[#456C8D] border-[#6FA6FF]/30" },
  inactive: { label: "Inativo", color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]" }
};

const statusProjectConfig = {
  active: { label: "Ativo", color: "bg-blue-50 text-blue-600" },
  completed: { label: "Concluído", color: "bg-green-50 text-green-600" },
  archived: { label: "Arquivado", color: "bg-slate-100 text-slate-500" },
};

export default function CompanyCard({ company, onEdit, onDelete, linkedProjects = [] }) {
  const status = statusConfig[company.status] || statusConfig.lead;
  const companyAge = company.founded_year ? new Date().getFullYear() - company.founded_year : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden border border-[#EAEAEA] rounded-2xl h-full bg-white hover:border-[#D0D0D0] transition-all shadow-none">
        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-11 h-11 rounded-xl object-cover border border-[#EAEAEA] flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#456C8D]" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-normal text-base text-[#131A20] truncate leading-snug">{company.name}</h3>
                <p className="text-xs font-light text-[#456C8D] truncate mt-0.5">{company.segment}</p>
              </div>
            </div>
            <div className="flex gap-0.5 flex-shrink-0 ml-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#456C8D] hover:text-[#131A20] hover:bg-[#F7F7F7] rounded-xl" onClick={() => onEdit(company)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#456C8D] hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => onDelete(company.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Status badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center text-[11px] font-light px-2.5 py-1 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Info rows */}
          <div className="space-y-1.5">
            {company.average_revenue && (
              <div className="flex items-center gap-2 text-xs text-[#456C8D] font-light">
                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                <span>R$ {parseFloat(company.average_revenue).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês</span>
              </div>
            )}
            {companyAge !== null && companyAge >= 0 && (
              <div className="flex items-center gap-2 text-xs text-[#456C8D] font-light">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{companyAge} {companyAge === 1 ? 'ano' : 'anos'}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-xs text-[#456C8D] font-light">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{company.phone}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2 text-xs text-[#456C8D] font-light">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
          </div>

          {/* Projetos vinculados */}
          {linkedProjects.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#EAEAEA]">
              <div className="flex items-center gap-1.5 mb-2">
                <FolderKanban className="w-3.5 h-3.5 text-[#6FA6FF]" />
                <span className="text-[11px] font-medium text-[#456C8D]">
                  {linkedProjects.length} projeto{linkedProjects.length !== 1 ? 's' : ''} vinculado{linkedProjects.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1">
                {linkedProjects.slice(0, 3).map(p => {
                  const ps = statusProjectConfig[p.status] || statusProjectConfig.active;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-light text-[#131A20] truncate">{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-light flex-shrink-0 ${ps.color}`}>
                        {ps.label}
                      </span>
                    </div>
                  );
                })}
                {linkedProjects.length > 3 && (
                  <p className="text-[10px] text-[#456C8D] font-light">+{linkedProjects.length - 3} mais</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[#EAEAEA]">
            <span className="text-[10px] font-light text-[#456C8D]">
              Cadastrado {new Date(company.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
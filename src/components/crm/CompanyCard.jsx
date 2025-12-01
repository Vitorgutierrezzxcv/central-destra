import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Building2, Calendar, DollarSign, Phone, Mail } from "lucide-react";

const statusConfig = {
  lead: { label: "Lead", color: "bg-[#EAEAEA] text-[#456C8D] dark:text-[#8b949e] border-[#EAEAEA] dark:border-[#30363d]" },
  client: { label: "Cliente", color: "bg-[#6FA6FF]/20 text-[#456C8D] dark:text-[#8b949e] border-[#6FA6FF]/30" },
  inactive: { label: "Inativo", color: "bg-[#EAEAEA] text-[#456C8D] dark:text-[#8b949e] border-[#EAEAEA] dark:border-[#30363d]" }
};

export default function CompanyCard({ company, onEdit, onDelete }) {
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
      <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#EAEAEA] dark:border-[#30363d] dark:border-[#30363d] rounded-xl h-full bg-white dark:bg-[#161b22]">
        <div className="h-24 md:h-28 bg-[#456C8D] p-4 md:p-5">
          <div className="flex items-start justify-between">
            <Badge className={`${status.color} border text-xs`}>
              {status.label}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => onEdit(company)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => onDelete(company.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3 mb-4">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-[#EAEAEA] dark:border-[#30363d]"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#EAEAEA] flex items-center justify-center border-2 border-[#EAEAEA] dark:border-[#30363d]">
                <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#456C8D] dark:text-[#8b949e]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-[#131A20] dark:text-white mb-1 line-clamp-2">
                {company.name}
              </h3>
              <p className="text-sm text-[#456C8D] dark:text-[#8b949e] line-clamp-1">{company.segment}</p>
            </div>
          </div>

          <div className="space-y-2">
            {company.average_revenue && (
              <div className="flex items-center gap-2 text-sm text-[#456C8D] dark:text-[#8b949e]">
                <DollarSign className="w-4 h-4 text-[#6FA6FF]" />
                <span className="font-medium">
                  R$ {parseFloat(company.average_revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </span>
              </div>
            )}
            
            {companyAge !== null && companyAge >= 0 && (
              <div className="flex items-center gap-2 text-sm text-[#456C8D] dark:text-[#8b949e]">
                <Calendar className="w-4 h-4 text-[#6FA6FF]" />
                <span>{companyAge} {companyAge === 1 ? 'ano' : 'anos'} de fundação</span>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-2 text-sm text-[#456C8D] dark:text-[#8b949e]">
                <Phone className="w-4 h-4 text-[#6FA6FF]" />
                <span className="truncate">{company.phone}</span>
              </div>
            )}

            {company.email && (
              <div className="flex items-center gap-2 text-sm text-[#456C8D] dark:text-[#8b949e]">
                <Mail className="w-4 h-4 text-[#6FA6FF]" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
          </div>

          {company.address && (
            <div className="mt-3 pt-3 border-t border-[#EAEAEA] dark:border-[#30363d]">
              <p className="text-xs text-[#456C8D] dark:text-[#8b949e] line-clamp-2">{company.address}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#EAEAEA] dark:border-[#30363d]">
            <span className="text-xs text-[#456C8D] dark:text-[#8b949e]">
              Criado em {new Date(company.created_date).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
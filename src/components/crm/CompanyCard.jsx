import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Building2, Calendar, DollarSign, Phone, Mail } from "lucide-react";

const statusConfig = {
  lead: { label: "Lead", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  client: { label: "Cliente", color: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inativo", color: "bg-slate-100 text-slate-700 border-slate-200" }
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
      <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm h-full">
        <div className="h-24 md:h-28 bg-gradient-to-br from-green-400 to-teal-500 p-4 md:p-5">
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
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-slate-200 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center border-2 border-slate-200 shadow-md">
                <Building2 className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">
                {company.name}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-1">{company.segment}</p>
            </div>
          </div>

          <div className="space-y-2">
            {company.average_revenue && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  R$ {parseFloat(company.average_revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </span>
              </div>
            )}
            
            {companyAge !== null && companyAge >= 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{companyAge} {companyAge === 1 ? 'ano' : 'anos'} de fundação</span>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-purple-600" />
                <span className="truncate">{company.phone}</span>
              </div>
            )}

            {company.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-orange-600" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
          </div>

          {company.address && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 line-clamp-2">{company.address}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
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
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, User, DollarSign, Calendar, Pencil, Trash2 } from "lucide-react";

const stageLabels = {
  prospecting: "Prospecção",
  qualification: "Qualificação",
  presentation: "Apresentação",
  negotiation: "Negociação",
  closing: "Fechamento",
  post_sale: "Pós-venda"
};

const stageColors = {
  prospecting: "bg-slate-100 text-slate-700",
  qualification: "bg-blue-100 text-blue-700",
  presentation: "bg-purple-100 text-purple-700",
  negotiation: "bg-orange-100 text-orange-700",
  closing: "bg-emerald-100 text-emerald-700",
  post_sale: "bg-teal-100 text-teal-700"
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-200 text-slate-700" },
  medium: { label: "Média", color: "bg-blue-200 text-blue-700" },
  high: { label: "Alta", color: "bg-red-200 text-red-700" }
};

export default function OpportunityList({ opportunities, companies, onEdit, onDelete }) {
  const openOpportunities = opportunities.filter(o => o.status === 'open');

  if (openOpportunities.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl">
        <p className="text-slate-600">Nenhuma oportunidade aberta no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {openOpportunities.map((opportunity) => {
        const company = companies.find(c => c.id === opportunity.company_id);
        const priority = priorityConfig[opportunity.priority] || priorityConfig.medium;

        return (
          <motion.div
            key={opportunity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white border border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{opportunity.title}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={stageColors[opportunity.stage]}>
                            {stageLabels[opportunity.stage]}
                          </Badge>
                          <Badge className={`${priority.color} text-xs`}>
                            {priority.label}
                          </Badge>
                          {opportunity.probability !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {opportunity.probability}% chance
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {company && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Building2 className="w-4 h-4" />
                              <span>{company.name}</span>
                            </div>
                          )}

                          {opportunity.value && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-600">
                                R$ {parseFloat(opportunity.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          {opportunity.contact_name && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="w-4 h-4" />
                              <span>{opportunity.contact_name}</span>
                            </div>
                          )}

                          {opportunity.expected_close_date && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>

                        {opportunity.next_step && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">
                              <strong className="text-slate-900">Próxima ação:</strong> {opportunity.next_step}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(opportunity)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(opportunity.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
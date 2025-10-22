import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Building2, User, Calendar, DollarSign, Phone, Mail } from "lucide-react";

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-200 text-slate-700" },
  medium: { label: "Média", color: "bg-blue-200 text-blue-700" },
  high: { label: "Alta", color: "bg-red-200 text-red-700" }
};

export default function OpportunityCard({ opportunity, company, onEdit, onDelete, isDragging }) {
  const priority = priorityConfig[opportunity.priority] || priorityConfig.medium;

  return (
    <Card className={`bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all ${
      isDragging ? 'opacity-50 rotate-2' : ''
    }`}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1 pr-2">
            {opportunity.title}
          </h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(opportunity);
              }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(opportunity.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {company && (
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{company.name}</span>
          </div>
        )}

        {opportunity.value && (
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-600">
              R$ {parseFloat(opportunity.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge className={`${priority.color} text-xs px-1.5 py-0.5`}>
            {priority.label}
          </Badge>
          {opportunity.probability !== undefined && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {opportunity.probability}% chance
            </Badge>
          )}
        </div>

        {opportunity.contact_name && (
          <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate">{opportunity.contact_name}</span>
          </div>
        )}

        {opportunity.expected_close_date && (
          <div className="text-xs text-slate-600 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')}</span>
          </div>
        )}

        {opportunity.next_step && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 line-clamp-2">
              <strong>Próximo:</strong> {opportunity.next_step}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
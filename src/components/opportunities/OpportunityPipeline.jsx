import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, DollarSign, User, Clock, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const stages = [
  { key: "prospecting", label: "Prospecção", color: "from-slate-400 to-slate-500" },
  { key: "qualification", label: "Qualificação", color: "from-blue-400 to-blue-500" },
  { key: "presentation", label: "Apresentação", color: "from-purple-400 to-purple-500" },
  { key: "negotiation", label: "Negociação", color: "from-orange-400 to-orange-500" },
  { key: "closing", label: "Fechamento", color: "from-green-400 to-green-500" },
  { key: "post_sale", label: "Pós-venda", color: "from-teal-400 to-teal-500" },
];

export default function OpportunityPipeline({ opportunities, companies, onEdit, onDelete, onStageChange }) {
  const getOpportunitiesByStage = (stage) => {
    return opportunities.filter(opp => opp.stage === stage);
  };

  const getStageValue = (stage) => {
    return getOpportunitiesByStage(stage)
      .reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const opportunity = opportunities.find(opp => opp.id === draggableId);
    if (opportunity && onStageChange) {
      onStageChange(opportunity, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageOpps = getOpportunitiesByStage(stage.key);
          const stageValue = getStageValue(stage.key);

          return (
            <div key={stage.key} className="flex-shrink-0 w-80">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-t-4" style={{ borderTopColor: `hsl(var(--${stage.key}))` }}>
                <CardHeader className={`bg-gradient-to-r ${stage.color} text-white rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{stage.label}</CardTitle>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {stageOpps.length}
                    </Badge>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-white/90 mt-1">
                      R$ {stageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </CardHeader>
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <CardContent 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 space-y-3 max-h-[calc(100vh-300px)] min-h-[100px] overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-100' : ''
                      }`}
                    >
                      {stageOpps.length === 0 && !snapshot.isDraggingOver ? (
                        <p className="text-center text-slate-400 text-sm py-8">
                          Nenhuma oportunidade
                        </p>
                      ) : (
                        stageOpps.map((opp, index) => {
                          const company = companies.find(c => c.id === opp.company_id);
                          return (
                            <Draggable key={opp.id} draggableId={opp.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-lg p-3 shadow hover:shadow-md transition-shadow border border-slate-200 ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-400' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 flex-1">
                                      {opp.title}
                                    </h4>
                                    <div className="flex gap-1 ml-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-slate-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEdit(opp);
                                        }}
                                      >
                                        <Pencil className="w-3 h-3 text-slate-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDelete(opp.id);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {company && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                                      <Building2 className="w-3 h-3" />
                                      <span className="truncate">{company.name}</span>
                                    </div>
                                  )}

                                  {opp.value && (
                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mb-2">
                                      <DollarSign className="w-3 h-3" />
                                      R$ {parseFloat(opp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                  )}

                                  {opp.probability && (
                                    <div className="mb-2">
                                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                                        <span>Probabilidade</span>
                                        <span>{opp.probability}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                                        <div 
                                          className="bg-emerald-500 h-1.5 rounded-full" 
                                          style={{ width: `${opp.probability}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    {opp.expected_close_date && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(opp.expected_close_date), 'dd/MM', { locale: ptBR })}
                                      </div>
                                    )}
                                    {opp.contact_name && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span className="truncate max-w-[100px]">{opp.contact_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
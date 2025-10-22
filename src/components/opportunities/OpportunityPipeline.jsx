import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DndContext, DragOverlay, closestCorners } from "@hello-pangea/dnd";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import OpportunityCard from "./OpportunityCard";

const stages = [
  { 
    id: "prospecting", 
    label: "Prospecção/Atração",
    color: "from-slate-400 to-slate-500",
    bgColor: "bg-slate-50"
  },
  { 
    id: "qualification", 
    label: "Qualificação",
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-50"
  },
  { 
    id: "presentation", 
    label: "Apresentação",
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-50"
  },
  { 
    id: "negotiation", 
    label: "Negociação",
    color: "from-orange-400 to-orange-500",
    bgColor: "bg-orange-50"
  },
  { 
    id: "closing", 
    label: "Fechamento",
    color: "from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-50"
  },
  { 
    id: "post_sale", 
    label: "Pós-venda",
    color: "from-teal-400 to-teal-500",
    bgColor: "bg-teal-50"
  }
];

export default function OpportunityPipeline({ opportunities, companies, onEdit, onDelete, updateMutation }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const opportunityId = result.draggableId;
    const newStage = result.destination.droppableId;
    const opportunity = opportunities.find(o => o.id === opportunityId);

    if (opportunity && opportunity.stage !== newStage) {
      updateMutation.mutate({
        id: opportunityId,
        opportunityData: { ...opportunity, stage: newStage }
      });
    }
  };

  const getStageOpportunities = (stageId) => {
    return opportunities.filter(o => o.stage === stageId && o.status === 'open');
  };

  const getStageValue = (stageId) => {
    return getStageOpportunities(stageId)
      .reduce((sum, o) => sum + (o.value || 0), 0);
  };

  return (
    <div className="space-y-6">
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map((stage) => {
            const stageOpportunities = getStageOpportunities(stage.id);
            const stageValue = getStageValue(stage.id);

            return (
              <div key={stage.id} className="flex flex-col">
                <Card className={`${stage.bgColor} border-none shadow-md mb-3`}>
                  <CardHeader className="p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm md:text-base font-bold text-slate-900">
                        {stage.label}
                      </CardTitle>
                      <Badge className="bg-white text-slate-700 text-xs">
                        {stageOpportunities.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">
                      R$ {stageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardHeader>
                </Card>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 p-2 rounded-lg transition-colors min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-slate-100' : ''
                      }`}
                    >
                      {stageOpportunities.map((opportunity, index) => {
                        const company = companies.find(c => c.id === opportunity.company_id);
                        return (
                          <Draggable
                            key={opportunity.id}
                            draggableId={opportunity.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <OpportunityCard
                                  opportunity={opportunity}
                                  company={company}
                                  onEdit={onEdit}
                                  onDelete={onDelete}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
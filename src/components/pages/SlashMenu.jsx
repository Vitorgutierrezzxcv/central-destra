import React from "react";
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Minus,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";

const blockTypes = [
  { type: 'paragraph', label: 'Texto', icon: Type, description: 'Parágrafo comum' },
  { type: 'heading_1', label: 'Título 1', icon: Heading1, description: 'Título grande' },
  { type: 'heading_2', label: 'Título 2', icon: Heading2, description: 'Título médio' },
  { type: 'heading_3', label: 'Título 3', icon: Heading3, description: 'Título pequeno' },
  { type: 'bulleted_list', label: 'Lista', icon: List, description: 'Lista com bullets' },
  { type: 'numbered_list', label: 'Lista Numerada', icon: ListOrdered, description: 'Lista ordenada' },
  { type: 'todo', label: 'To-do', icon: CheckSquare, description: 'Checkbox' },
  { type: 'quote', label: 'Citação', icon: Quote, description: 'Bloco de citação' },
  { type: 'code_block', label: 'Código', icon: Code, description: 'Bloco de código' },
  { type: 'callout', label: 'Callout', icon: AlertCircle, description: 'Nota destacada' },
  { type: 'divider', label: 'Divisor', icon: Minus, description: 'Linha horizontal' },
  { type: 'image', label: 'Imagem', icon: Image, description: 'Upload ou URL' },
];

export default function SlashMenu({ onSelect, position }) {
  return (
    <Card 
      className="absolute z-50 w-80 max-h-96 overflow-y-auto shadow-xl border-slate-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2">
        <div className="text-xs font-semibold text-slate-500 uppercase px-2 py-1">
          Blocos
        </div>
        {blockTypes.map(block => {
          const Icon = block.icon;
          return (
            <button
              key={block.type}
              onClick={() => onSelect(block.type)}
              className="w-full flex items-start gap-3 px-2 py-2 rounded hover:bg-slate-100 transition-colors text-left"
            >
              <Icon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-slate-900">{block.label}</div>
                <div className="text-xs text-slate-500">{block.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
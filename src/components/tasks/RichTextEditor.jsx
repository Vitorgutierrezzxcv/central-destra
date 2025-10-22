import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Type,
  X,
  Plus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RichTextEditor({ value, onChange, placeholder }) {
  const [mode, setMode] = useState("text"); // "text" or "checklist"
  const [textContent, setTextContent] = useState("");
  const [checklistItems, setChecklistItems] = useState([]);

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.type === "checklist") {
          setMode("checklist");
          setChecklistItems(parsed.items || []);
        } else {
          setMode("text");
          setTextContent(parsed.content || value);
        }
      } catch {
        setMode("text");
        setTextContent(value);
      }
    }
  }, []);

  const handleTextChange = (newText) => {
    setTextContent(newText);
    onChange(JSON.stringify({ type: "text", content: newText }));
  };

  const handleChecklistChange = (items) => {
    setChecklistItems(items);
    onChange(JSON.stringify({ type: "checklist", items }));
  };

  const addChecklistItem = () => {
    const newItems = [...checklistItems, { id: Date.now(), text: "", completed: false }];
    handleChecklistChange(newItems);
  };

  const updateChecklistItem = (id, text) => {
    const newItems = checklistItems.map(item => 
      item.id === id ? { ...item, text } : item
    );
    handleChecklistChange(newItems);
  };

  const removeChecklistItem = (id) => {
    const newItems = checklistItems.filter(item => item.id !== id);
    handleChecklistChange(newItems);
  };

  const toggleChecklistItem = (id) => {
    const newItems = checklistItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleChecklistChange(newItems);
  };

  return (
    <div className="space-y-3">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 h-9">
          <TabsTrigger 
            value="text" 
            className="flex items-center gap-2 text-xs data-[state=active]:bg-white"
            onClick={() => {
              setMode("text");
              onChange(JSON.stringify({ type: "text", content: textContent }));
            }}
          >
            <Type className="w-3.5 h-3.5" />
            Texto
          </TabsTrigger>
          <TabsTrigger 
            value="checklist" 
            className="flex items-center gap-2 text-xs data-[state=active]:bg-white"
            onClick={() => {
              setMode("checklist");
              onChange(JSON.stringify({ type: "checklist", items: checklistItems }));
            }}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-3">
          <Textarea
            placeholder={placeholder || "Adicione detalhes sobre a tarefa..."}
            value={textContent}
            onChange={(e) => handleTextChange(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </TabsContent>

        <TabsContent value="checklist" className="mt-3">
          <Card className="p-3 bg-slate-50 border-slate-200">
            <div className="space-y-2 mb-3">
              {checklistItems.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item na checklist</p>
                  <p className="text-xs mt-1">Adicione itens para organizar as subtarefas</p>
                </div>
              ) : (
                checklistItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                      placeholder={`Item ${index + 1}...`}
                      className={`flex-1 bg-transparent border-none outline-none text-sm ${
                        item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChecklistItem(item.id)}
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChecklistItem}
              className="w-full h-9 border-dashed border-slate-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
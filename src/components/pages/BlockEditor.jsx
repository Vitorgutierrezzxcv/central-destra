import React, { useState, useRef, useEffect } from "react";
import { 
  Check, 
  Image as ImageIcon, 
  Code, 
  Quote, 
  AlertCircle,
  Minus,
  GripVertical
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function BlockEditor({ 
  block, 
  onUpdate, 
  onDelete, 
  onEnter, 
  onBackspace,
  onSlashCommand,
  autoFocus 
}) {
  const [localContent, setLocalContent] = useState(block.content || {});
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleContentChange = (updates) => {
    const newContent = { ...localContent, ...updates };
    setLocalContent(newContent);
    onUpdate({ ...block, content: newContent });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Backspace' && !localContent.text) {
      e.preventDefault();
      onBackspace();
    } else if (e.key === '/' && !localContent.text) {
      e.preventDefault();
      onSlashCommand();
    }
  };

  const commonProps = {
    ref: inputRef,
    value: localContent.text || '',
    onChange: (e) => handleContentChange({ text: e.target.value }),
    onKeyDown: handleKeyDown,
    className: "w-full border-none focus:ring-0 resize-none bg-transparent",
    placeholder: "Digite '/' para comandos..."
  };

  switch (block.type) {
    case 'heading_1':
      return (
        <input
          {...commonProps}
          className="w-full text-3xl font-bold border-none focus:ring-0 bg-transparent"
          placeholder="Título 1"
        />
      );
    
    case 'heading_2':
      return (
        <input
          {...commonProps}
          className="w-full text-2xl font-semibold border-none focus:ring-0 bg-transparent"
          placeholder="Título 2"
        />
      );
    
    case 'heading_3':
      return (
        <input
          {...commonProps}
          className="w-full text-xl font-semibold border-none focus:ring-0 bg-transparent"
          placeholder="Título 3"
        />
      );

    case 'bulleted_list':
      return (
        <div className="flex items-start gap-2">
          <span className="text-slate-400 mt-2">•</span>
          <Textarea
            {...commonProps}
            rows={1}
            placeholder="Item da lista"
          />
        </div>
      );

    case 'numbered_list':
      return (
        <div className="flex items-start gap-2">
          <span className="text-slate-400 mt-2">1.</span>
          <Textarea
            {...commonProps}
            rows={1}
            placeholder="Item numerado"
          />
        </div>
      );

    case 'todo':
      return (
        <div className="flex items-start gap-2">
          <Checkbox
            checked={localContent.checked || false}
            onCheckedChange={(checked) => handleContentChange({ checked })}
            className="mt-2"
          />
          <Textarea
            {...commonProps}
            rows={1}
            placeholder="To-do"
            className={localContent.checked ? 'line-through text-slate-400' : ''}
          />
        </div>
      );

    case 'quote':
      return (
        <div className="border-l-4 border-slate-300 pl-4 italic">
          <Textarea
            {...commonProps}
            rows={2}
            placeholder="Citação..."
          />
        </div>
      );

    case 'code_block':
      return (
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
          <div className="mb-2">
            <Input
              value={localContent.language || ''}
              onChange={(e) => handleContentChange({ language: e.target.value })}
              placeholder="linguagem"
              className="w-32 h-6 text-xs bg-slate-800 text-slate-300 border-slate-700"
            />
          </div>
          <Textarea
            value={localContent.code || ''}
            onChange={(e) => handleContentChange({ code: e.target.value })}
            placeholder="// seu código aqui"
            className="font-mono text-sm bg-slate-900 text-slate-100 border-none"
            rows={5}
          />
        </div>
      );

    case 'callout':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <Textarea
            {...commonProps}
            rows={2}
            placeholder="Nota importante..."
            className="bg-transparent"
          />
        </div>
      );

    case 'image':
      return (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-slate-400" />
            <Input
              value={localContent.url || ''}
              onChange={(e) => handleContentChange({ url: e.target.value })}
              placeholder="URL da imagem"
              className="max-w-md"
            />
            {localContent.url && (
              <img 
                src={localContent.url} 
                alt="Conteúdo" 
                className="max-w-full rounded-lg mt-2"
              />
            )}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="py-2">
          <hr className="border-slate-200" />
        </div>
      );

    default: // paragraph
      return (
        <Textarea
          {...commonProps}
          rows={1}
          placeholder="Digite '/' para comandos..."
        />
      );
  }
}
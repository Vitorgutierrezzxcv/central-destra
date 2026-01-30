import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Star, 
  Trash2, 
  MoreHorizontal, 
  Plus,
  Image as ImageIcon,
  Smile,
  Check,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BlockEditor from "./BlockEditor";
import SlashMenu from "./SlashMenu";
import { motion, AnimatePresence } from "framer-motion";

export default function PageEditor({ page, blocks, onBack, currentUser }) {
  const [title, setTitle] = useState(page?.title || "");
  const [icon, setIcon] = useState(page?.icon || "📄");
  const [localBlocks, setLocalBlocks] = useState(blocks || []);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuBlock, setSlashMenuBlock] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [autoFocusBlock, setAutoFocusBlock] = useState(null);
  const saveTimeoutRef = useRef(null);
  const queryClient = useQueryClient();
  const pasteInputRef = useRef(null);

  useEffect(() => {
    setTitle(page?.title || "");
    setIcon(page?.icon || "📄");
    setLocalBlocks(blocks || []);
  }, [page?.id, blocks]);

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Page.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setSaveStatus("saved");
    },
  });

  const saveBlocksMutation = useMutation({
    mutationFn: async (blocksToSave) => {
      // Delete all existing blocks
      const existingBlocks = await base44.entities.PageBlock.filter({ page_id: page.id });
      await Promise.all(existingBlocks.map(b => base44.entities.PageBlock.delete(b.id)));
      
      // Create new blocks
      const createPromises = blocksToSave.map((block, index) => 
        base44.entities.PageBlock.create({
          page_id: page.id,
          type: block.type,
          content: block.content || {},
          sort_order: index
        })
      );
      return Promise.all(createPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-blocks'] });
      setSaveStatus("saved");
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id) => base44.entities.Page.update(id, { 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      onBack();
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      base44.entities.Page.update(id, { is_favorite: isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const autoSave = (data, isBlocks = false) => {
    setSaveStatus("saving");
    clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      if (isBlocks) {
        saveBlocksMutation.mutate(data);
      } else {
        updatePageMutation.mutate({ id: page.id, data: { ...data, last_edited_by: currentUser?.email } });
      }
    }, 800);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    autoSave({ title: newTitle });
  };

  const handleIconChange = (newIcon) => {
    setIcon(newIcon);
    autoSave({ icon: newIcon });
  };

  const handleBlockUpdate = (index, updatedBlock) => {
    const newBlocks = [...localBlocks];
    newBlocks[index] = updatedBlock;
    setLocalBlocks(newBlocks);
    autoSave(newBlocks, true);
  };

  const handleAddBlock = (index, type = 'paragraph') => {
    const newBlock = {
      type,
      content: {},
      sort_order: index
    };
    const newBlocks = [...localBlocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setLocalBlocks(newBlocks);
    setAutoFocusBlock(index + 1);
    autoSave(newBlocks, true);
  };

  const handleDeleteBlock = (index) => {
    if (localBlocks.length === 1) return; // Manter pelo menos 1 bloco
    const newBlocks = localBlocks.filter((_, i) => i !== index);
    setLocalBlocks(newBlocks);
    autoSave(newBlocks, true);
  };

  const handleSlashCommand = (index) => {
    setSlashMenuBlock(index);
    setShowSlashMenu(true);
  };

  const handleSlashSelect = (type) => {
    if (slashMenuBlock !== null) {
      const newBlocks = [...localBlocks];
      newBlocks[slashMenuBlock] = { type, content: {}, sort_order: slashMenuBlock };
      setLocalBlocks(newBlocks);
      autoSave(newBlocks, true);
    }
    setShowSlashMenu(false);
    setSlashMenuBlock(null);
  };

  // Adicionar primeiro bloco se não houver nenhum
  useEffect(() => {
    if (localBlocks.length === 0) {
      setLocalBlocks([{ type: 'paragraph', content: {}, sort_order: 0 }]);
    }
  }, [localBlocks.length]);

  const parseMarkdownToBlocks = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const blocks = [];
    let currentListType = null;
    let currentListItems = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Heading 1 (# ou ##)
      if (trimmed.startsWith('# ')) {
        blocks.push({
          type: 'heading_1',
          content: { text: trimmed.replace(/^#+ /, '').replace(/\*\*/g, '') }
        });
        currentListType = null;
      } 
      // Heading 2
      else if (trimmed.startsWith('## ')) {
        blocks.push({
          type: 'heading_2',
          content: { text: trimmed.replace(/^#+ /, '').replace(/\*\*/g, '') }
        });
        currentListType = null;
      }
      // Heading 3
      else if (trimmed.startsWith('### ')) {
        blocks.push({
          type: 'heading_3',
          content: { text: trimmed.replace(/^#+ /, '').replace(/\*\*/g, '') }
        });
        currentListType = null;
      }
      // Bullet list
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.replace(/^[-*] /, '').replace(/\*\*/g, '');
        blocks.push({
          type: 'bulleted_list',
          content: { text }
        });
        currentListType = null;
      }
      // Numbered list
      else if (/^\d+\. /.test(trimmed)) {
        const text = trimmed.replace(/^\d+\. /, '').replace(/\*\*/g, '');
        blocks.push({
          type: 'numbered_list',
          content: { text }
        });
        currentListType = null;
      }
      // Regular paragraph
      else {
        const cleanText = trimmed.replace(/\*\*/g, '');
        blocks.push({
          type: 'paragraph',
          content: { text: cleanText }
        });
      }
    });

    return blocks;
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text.trim()) return;

    setSaveStatus("saving");
    
    try {
      // Primeiro tenta parsing local de markdown
      let parsedBlocks = parseMarkdownToBlocks(text);
      
      // Se não encontrou estrutura, usa LLM
      if (parsedBlocks.length === 1) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este conteúdo e reconheça EXATAMENTE sua estrutura:
- Títulos (# = heading_1, ## = heading_2, ### = heading_3)
- Parágrafos
- Listas com bullets (- ou *)
- Listas numeradas (1. 2. 3.)
- Negrito (**texto**)
- Itálico (*texto*)

Conteúdo:
${text}

Retorne APENAS JSON:
{
  "blocks": [
    {"type": "heading_2", "content": {"text": "Playbook de Branding: O Guia Definitivo para a Construção da Marca"}},
    {"type": "paragraph", "content": {"text": "..."}}
  ]
}`,
          response_json_schema: {
            type: "object",
            properties: {
              blocks: {
                type: "array",
                items: { type: "object" }
              }
            }
          }
        });
        parsedBlocks = result?.blocks || parsedBlocks;
      }

      if (parsedBlocks.length > 0) {
        const newBlocks = [...localBlocks, ...parsedBlocks];
        setLocalBlocks(newBlocks);
        autoSave(newBlocks, true);
      }
    } catch (error) {
      console.error('Erro ao processar cola:', error);
      setSaveStatus("saved");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Voltar
          </Button>
          <div className="flex items-center gap-2">
            {saveStatus === "saving" ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Check className="w-3 h-3 text-green-600" />
                Salvo
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavoriteMutation.mutate({ 
              id: page.id, 
              isFavorite: !page.is_favorite 
            })}
          >
            <Star className={`w-4 h-4 ${page.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => deletePageMutation.mutate(page.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Mover para lixeira
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cover Image (placeholder) */}
      {page?.cover_image_url && (
        <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600" />
      )}

      {/* Hidden paste handler */}
      <input 
        ref={pasteInputRef}
        type="hidden" 
        onPaste={handlePaste}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12" onPaste={handlePaste}>
        {/* Icon & Title */}
        <div className="mb-8">
          <button 
            onClick={() => {
              const emojis = ['📄', '📝', '📋', '📌', '💡', '🎯', '📊', '🚀', '⭐', '🔥'];
              const random = emojis[Math.floor(Math.random() * emojis.length)];
              handleIconChange(random);
            }}
            className="text-6xl mb-4 hover:scale-110 transition-transform"
          >
            {icon}
          </button>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Sem título"
            className="text-4xl font-bold border-none focus-visible:ring-0 px-0 h-auto"
          />
        </div>

        {/* Blocks */}
        <div className="space-y-2">
          <AnimatePresence>
            {localBlocks.map((block, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group relative"
              >
                <BlockEditor
                  block={block}
                  onUpdate={(updated) => handleBlockUpdate(index, updated)}
                  onDelete={() => handleDeleteBlock(index)}
                  onEnter={() => handleAddBlock(index)}
                  onBackspace={() => handleDeleteBlock(index)}
                  onSlashCommand={() => handleSlashCommand(index)}
                  autoFocus={autoFocusBlock === index}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleAddBlock(index)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add block button */}
          <Button
            variant="ghost"
            onClick={() => handleAddBlock(localBlocks.length - 1)}
            className="text-slate-400 hover:text-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Clique ou digite '/' para adicionar bloco
          </Button>
        </div>
      </div>

      {/* Slash Menu */}
      {showSlashMenu && (
        <SlashMenu
          position={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          onSelect={handleSlashSelect}
        />
      )}
    </div>
  );
}
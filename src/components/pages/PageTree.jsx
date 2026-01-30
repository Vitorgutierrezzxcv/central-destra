import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Star, Clock, FileText, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function PageTree({ pages, onSelectPage, selectedPageId, onCreatePage, favorites, recents }) {
  const [expandedPages, setExpandedPages] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (pageId) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const buildTree = (parentId = null) => {
    return pages
      .filter(p => p.parent_page_id === parentId && !p.is_deleted)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  const hasChildren = (pageId) => {
    return pages.some(p => p.parent_page_id === pageId && !p.is_deleted);
  };

  const filterPages = (query) => {
    if (!query) return pages;
    return pages.filter(p => 
      !p.is_deleted && 
      p.title?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredPages = filterPages(searchQuery);

  const PageItem = ({ page, level = 0 }) => {
    const isExpanded = expandedPages.has(page.id);
    const isSelected = selectedPageId === page.id;
    const children = buildTree(page.id);
    const hasKids = hasChildren(page.id);

    return (
      <div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`
            flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer
            hover:bg-slate-100 transition-colors group
            ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectPage(page)}
        >
          {hasKids && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(page.id);
              }}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
            </button>
          )}
          {!hasKids && <div className="w-4" />}
          
          <span className="text-base mr-1">{page.icon || "📄"}</span>
          <span className={`text-sm flex-1 truncate ${isSelected ? 'font-semibold text-blue-900' : 'text-slate-700'}`}>
            {page.title || "Sem título"}
          </span>
        </motion.div>
        
        {isExpanded && children.length > 0 && (
          <AnimatePresence>
            {children.map(child => (
              <PageItem key={child.id} page={child} level={level + 1} />
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 border-r border-slate-200">
      <div className="p-3 border-b border-slate-200 space-y-2">
        <Button
          onClick={() => onCreatePage()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Página
        </Button>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar páginas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Favoritas */}
          {favorites && favorites.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
                <Star className="w-3 h-3" />
                Favoritas
              </div>
              {favorites.map(page => (
                <PageItem key={page.id} page={page} />
              ))}
            </div>
          )}

          {/* Recentes */}
          {recents && recents.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
                <Clock className="w-3 h-3" />
                Recentes
              </div>
              {recents.slice(0, 5).map(page => (
                <PageItem key={page.id} page={page} />
              ))}
            </div>
          )}

          {/* Todas as páginas */}
          <div>
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-500 uppercase mb-1">
              <FileText className="w-3 h-3" />
              {searchQuery ? 'Resultados' : 'Páginas'}
            </div>
            {searchQuery ? (
              filteredPages.length > 0 ? (
                filteredPages.map(page => (
                  <PageItem key={page.id} page={page} />
                ))
              ) : (
                <p className="text-sm text-slate-400 px-2 py-4 text-center">
                  Nenhuma página encontrada
                </p>
              )
            ) : (
              buildTree(null).map(page => (
                <PageItem key={page.id} page={page} />
              ))
            )}
          </div>

          {/* Lixeira */}
          {pages.some(p => p.is_deleted) && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-500 uppercase">
                <Trash2 className="w-3 h-3" />
                Lixeira
              </div>
              {pages.filter(p => p.is_deleted).map(page => (
                <PageItem key={page.id} page={page} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
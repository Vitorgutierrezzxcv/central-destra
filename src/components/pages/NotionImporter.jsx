import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NotionImporter({ onImportComplete }) {
  const [notionUrl, setNotionUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState(null);
  const queryClient = useQueryClient();

  const createPageMutation = useMutation({
    mutationFn: (pageData) => base44.entities.Page.create(pageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });

  const createBlocksMutation = useMutation({
    mutationFn: (blocks) => 
      Promise.all(blocks.map(block => base44.entities.PageBlock.create(block))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-blocks'] });
    },
  });

  const handleImport = async () => {
    if (!notionUrl) return;

    setIsImporting(true);
    setStatus({ type: 'info', message: 'Acessando página do Notion...' });

    try {
      // Primeiro, buscar a página html para extrair informações
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Acesse e analise COMPLETAMENTE esta página pública do Notion: ${notionUrl}

Extraia TUDO - título, ícone, TODOS os blocos, imagens, tabelas, código, listas, e TODAS as subpáginas (links que abrem novas páginas).

Para cada subpágina encontrada, acesse-a também e extraia seu conteúdo completo de forma recursiva.

Retorne APENAS em JSON puro (sem markdown, sem explicações):
{
  "title": "Título exato da página",
  "icon": "emoji",
  "blocks": [
    {"type": "heading_1", "content": {"text": "conteúdo"}},
    {"type": "paragraph", "content": {"text": "conteúdo"}}
  ],
  "subpages": [
    {"title": "Subpágina", "icon": "emoji", "blocks": [], "subpages": []}
  ]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            icon: { type: "string" },
            blocks: {
              type: "array",
              items: { type: "object" }
            },
            subpages: {
              type: "array",
              items: { type: "object" }
            }
          },
          required: ["title"]
        }
      });

      if (!result.title) {
        throw new Error("Não foi possível extrair o título da página");
      }

      setStatus({ type: 'info', message: `Criando "${result.title}" com ${result.subpages?.length || 0} subpáginas...` });

      // Função recursiva para criar páginas
      const createPageWithSubpages = async (pageData, parentId = null, sortOrder = 0) => {
        const newPage = await createPageMutation.mutateAsync({
          title: pageData.title || "Página Importada",
          icon: pageData.icon || "📄",
          workspace_id: "imported",
          parent_page_id: parentId || null,
          sort_order: sortOrder,
        });

        // Criar blocos
        if (pageData.blocks?.length) {
          const blocksToCreate = pageData.blocks.map((block, idx) => ({
            page_id: newPage.id,
            type: block.type,
            content: block.content || {},
            sort_order: idx
          }));

          try {
            await createBlocksMutation.mutateAsync(blocksToCreate);
          } catch (e) {
            console.error('Erro ao criar blocos:', e);
          }
        }

        // Criar subpáginas
        if (pageData.subpages?.length) {
          for (let i = 0; i < pageData.subpages.length; i++) {
            await createPageWithSubpages(pageData.subpages[i], newPage.id, i);
          }
        }

        return newPage;
      };

      await createPageWithSubpages(result);

      setStatus({ 
        type: 'success', 
        message: `✓ Wiki importada! ${result.subpages?.length || 0} subpáginas criadas.` 
      });
      setNotionUrl("");
      
      if (onImportComplete) {
        onImportComplete(result);
      }

    } catch (error) {
      console.error('Erro ao importar:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Erro na importação. Tente novamente.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-slate-300 w-full">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Download className="w-5 h-5 text-slate-600 flex-shrink-0" />
          <h3 className="font-semibold text-slate-900 text-sm md:text-base">Importar do Notion</h3>
        </div>

        <p className="text-xs md:text-sm text-slate-600 mb-3 md:mb-4 leading-relaxed">
          Cole o link de uma página pública do Notion para importar todo o conteúdo automaticamente.
        </p>

        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <Input
            placeholder="https://notion.so/..."
            value={notionUrl}
            onChange={(e) => setNotionUrl(e.target.value)}
            disabled={isImporting}
            className="flex-1 text-sm"
          />
          <Button
            onClick={handleImport}
            disabled={!notionUrl || isImporting}
            className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto flex-shrink-0 text-sm md:text-base"
            size="default"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="ml-2 hidden sm:inline">Importando...</span>
                <span className="ml-2 sm:hidden">...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="ml-2 hidden sm:inline">Importar</span>
                <span className="ml-2 sm:hidden">OK</span>
              </>
            )}
          </Button>
        </div>

        {status && (
          <Alert className={`text-sm md:text-base ${
            status.type === 'success' ? 'border-green-200 bg-green-50' :
            status.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex gap-2 md:gap-3">
              {status.type === 'success' && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />}
              {status.type === 'error' && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />}
              {status.type === 'info' && <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600 animate-spin flex-shrink-0" />}
              <AlertDescription className={`text-xs md:text-sm ${
                status.type === 'success' ? 'text-green-800' :
                status.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {status.message}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
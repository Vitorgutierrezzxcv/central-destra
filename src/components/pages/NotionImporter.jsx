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

Retorne em JSON:
{
  "title": "Título exato da página",
  "icon": "emoji ou símbolo visual",
  "blocks": [
    {
      "type": "heading_1|heading_2|heading_3|paragraph|bulleted_list|numbered_list|todo|quote|code_block|callout|divider|image|table",
      "content": {
        "text": "conteúdo",
        "checked": boolean (para todo),
        "language": "linguagem" (para code_block),
        "code": "código",
        "url": "url" (para imagem)
      }
    }
  ],
  "subpages": [
    {
      "title": "Título da subpágina",
      "icon": "emoji",
      "blocks": [],
      "subpages": []
    }
  ]
}

Seja PRECISO e COMPLETO. Toda informação visível deve estar no JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            icon: { type: "string" },
            blocks: { type: "array" },
            subpages: { type: "array" }
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
    <Card className="border-2 border-dashed border-slate-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Importar do Notion</h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Cole o link de uma página pública do Notion para importar todo o conteúdo automaticamente.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="https://notion.so/..."
            value={notionUrl}
            onChange={(e) => setNotionUrl(e.target.value)}
            disabled={isImporting}
            className="flex-1"
          />
          <Button
            onClick={handleImport}
            disabled={!notionUrl || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </div>

        {status && (
          <Alert className={
            status.type === 'success' ? 'border-green-200 bg-green-50' :
            status.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }>
            {status.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            {status.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
            {status.type === 'info' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
            <AlertDescription className={
              status.type === 'success' ? 'text-green-800' :
              status.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }>
              {status.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
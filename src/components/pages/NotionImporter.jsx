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
    setStatus({ type: 'info', message: 'Buscando página do Notion...' });

    try {
      // Usar LLM para extrair e converter conteúdo do Notion
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
Acesse esta página pública do Notion: ${notionUrl}

Extraia TODO o conteúdo da página e converta para o seguinte formato JSON:

{
  "title": "Título da página",
  "icon": "emoji se houver, senão 📄",
  "blocks": [
    {
      "type": "heading_1" | "heading_2" | "heading_3" | "paragraph" | "bulleted_list" | "numbered_list" | "todo" | "quote" | "code_block" | "callout" | "divider",
      "content": {
        "text": "conteúdo do bloco",
        "checked": true/false (apenas para todo),
        "language": "linguagem" (apenas para code_block),
        "code": "código" (apenas para code_block)
      }
    }
  ]
}

IMPORTANTE:
- Mantenha toda a formatação e estrutura
- Converta títulos para heading_1, heading_2, heading_3
- Converta listas com bullets para bulleted_list
- Converta listas numeradas para numbered_list
- Converta checkboxes para todo
- Converta blocos de código para code_block
- Converta callouts/avisos para callout
- Use divider para separadores
- Para parágrafos normais use paragraph

Retorne APENAS o JSON, sem texto adicional.
        `,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            icon: { type: "string" },
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  content: { type: "object" }
                }
              }
            }
          }
        }
      });

      setStatus({ type: 'info', message: 'Criando página...' });

      // Criar página
      const newPage = await createPageMutation.mutateAsync({
        title: result.title,
        icon: result.icon || "📄",
        workspace_id: "imported",
        sort_order: 0,
      });

      setStatus({ type: 'info', message: 'Importando blocos...' });

      // Criar blocos
      const blocksToCreate = result.blocks.map((block, index) => ({
        page_id: newPage.id,
        type: block.type,
        content: block.content,
        sort_order: index
      }));

      await createBlocksMutation.mutateAsync(blocksToCreate);

      setStatus({ 
        type: 'success', 
        message: `✓ Página "${result.title}" importada com sucesso! ${result.blocks.length} blocos criados.` 
      });

      setNotionUrl("");
      
      if (onImportComplete) {
        onImportComplete(newPage);
      }

    } catch (error) {
      console.error('Erro ao importar:', error);
      setStatus({ 
        type: 'error', 
        message: 'Erro ao importar. Verifique se a página é pública e tente novamente.' 
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
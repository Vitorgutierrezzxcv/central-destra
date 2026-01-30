import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTree from "../components/pages/PageTree";
import PageEditor from "../components/pages/PageEditor";
import NotionImporter from "../components/pages/NotionImporter";
import { Card, CardContent } from "@/components/ui/card";

export default function Pages() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pages, isLoading: loadingPages } = useQuery({
    queryKey: ['pages'],
    queryFn: () => base44.entities.Page.list('-updated_date'),
    initialData: [],
  });

  const { data: blocks, isLoading: loadingBlocks } = useQuery({
    queryKey: ['page-blocks', selectedPage?.id],
    queryFn: () => base44.entities.PageBlock.filter({ page_id: selectedPage.id }),
    initialData: [],
    enabled: !!selectedPage?.id,
  });

  const createPageMutation = useMutation({
    mutationFn: (pageData) => base44.entities.Page.create(pageData),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setSelectedPage(newPage);
    },
  });

  const handleCreatePage = (parentId = null) => {
    createPageMutation.mutate({
      title: "Sem título",
      icon: "📄",
      parent_page_id: parentId,
      workspace_id: user?.email || "default",
      sort_order: pages.length,
      last_edited_by: user?.email,
    });
  };

  const favorites = pages.filter(p => p.is_favorite && !p.is_deleted);
  const recents = [...pages]
    .filter(p => !p.is_deleted)
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 5);

  if (loadingPages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-600">Carregando páginas...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <PageTree
          pages={pages}
          onSelectPage={setSelectedPage}
          selectedPageId={selectedPage?.id}
          onCreatePage={handleCreatePage}
          favorites={favorites}
          recents={recents}
        />
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex-shrink-0 h-screen rounded-none border-l hover:bg-slate-100"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {selectedPage ? (
          <PageEditor
            page={selectedPage}
            blocks={blocks}
            onBack={() => setSelectedPage(null)}
            currentUser={user}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div className="max-w-2xl w-full space-y-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Bem-vindo às Páginas
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Crie documentos, wikis e bases de conhecimento organizadas em uma estrutura de páginas e subpáginas.
                  </p>
                  <Button
                    onClick={() => handleCreatePage()}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeira Página
                  </Button>
                </CardContent>
              </Card>

              <NotionImporter onImportComplete={(page) => setSelectedPage(page)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
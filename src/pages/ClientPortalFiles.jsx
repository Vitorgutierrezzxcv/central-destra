import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { File, Download, FileText, Image, Video, Archive, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const categoryLabels = {
  contract: "Contrato", presentation: "Apresentação", report: "Relatório",
  asset: "Asset", documentation: "Documentação", other: "Outro",
};

const categoryColors = {
  contract: "bg-purple-100 text-purple-700 border-purple-200",
  presentation: "bg-blue-100 text-blue-700 border-blue-200",
  report: "bg-emerald-100 text-emerald-700 border-emerald-200",
  asset: "bg-amber-100 text-amber-700 border-amber-200",
  documentation: "bg-slate-100 text-slate-600 border-slate-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

function getFileIcon(fileType) {
  if (!fileType) return File;
  const type = fileType.toLowerCase();
  if (type.includes("image") || type.includes("jpg") || type.includes("png")) return Image;
  if (type.includes("video")) return Video;
  if (type.includes("zip") || type.includes("rar")) return Archive;
  return FileText;
}

export default function ClientPortalFiles() {
  const { userLoading, projects, canAccessProject } = useClientPortal();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["client_files", activeProject?.id],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.uploaded_at || b.created_date) - new Date(a.uploaded_at || a.created_date))
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const categories = ["all", ...new Set(files.map(f => f.category).filter(Boolean))];

  const filtered = files.filter(f => {
    const matchSearch = !search || (f.title || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || f.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-14 pb-20">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">
          Arquivos
        </p>
        <h1 className="text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight mb-2">
          Documentos<br />Compartilhados
        </h1>
        <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed mb-8">
          Todos os arquivos do seu projeto.
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-4 pb-20">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar arquivos..."
              className="pl-9 border-slate-200"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  selectedCategory === cat ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                {cat === "all" ? "Todos" : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <File className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Nenhum arquivo encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(file => {
              const FileIcon = getFileIcon(file.file_type);
              return (
                <div key={file.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{file.title}</h3>
                      {file.category && (
                        <Badge className={`text-xs ${categoryColors[file.category] || categoryColors.other}`}>
                          {categoryLabels[file.category] || file.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {file.uploaded_by && `Enviado por ${file.uploaded_by}`}
                      {file.uploaded_at && ` • ${format(new Date(file.uploaded_at), "dd/MM/yyyy", { locale: ptBR })}`}
                    </p>
                  </div>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 rounded-xl text-xs text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
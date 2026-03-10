import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { File, Download, FileText, Image, Video, Archive, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const categoryLabels = {
  contract: "Contrato",
  presentation: "Apresentação",
  report: "Relatório",
  asset: "Asset",
  documentation: "Documentação",
  other: "Outro",
};

const categoryColors = {
  contract: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  presentation: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  report: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  asset: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  documentation: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
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
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["client_projects", user?.company_id],
    queryFn: () => base44.entities.Project.filter({ company_id: user.company_id, client_portal_enabled: true }),
    enabled: !!user?.company_id
  });
  const activeProject = projects.find(p => p.status === "active") || projects[0];

  const { data: files = [] } = useQuery({
    queryKey: ["client_files", activeProject?.id],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.uploaded_at || b.created_date) - new Date(a.uploaded_at || a.created_date))
  });

  const categories = ["all", ...new Set(files.map(f => f.category).filter(Boolean))];

  const filtered = files.filter(f => {
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || f.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Arquivos</h1>
          <p className="text-slate-400 text-sm mt-1">Documentos e arquivos compartilhados do seu projeto.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar arquivos..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border
                  ${selectedCategory === cat ? "bg-blue-600 border-blue-600 text-white" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}
              >
                {cat === "all" ? "Todos" : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum arquivo encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(file => {
              const FileIcon = getFileIcon(file.file_type);
              return (
                <div key={file.id} className="bg-[#0D1221] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{file.title}</h3>
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
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-xs text-blue-300 hover:bg-blue-600/30 transition-colors flex-shrink-0"
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
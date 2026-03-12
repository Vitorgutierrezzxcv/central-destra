import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileUp, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskFileUpload({ task, onFilesUpdate }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    await uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setIsLoading(true);
    try {
      const newUrls = task.attachment_urls ? [...task.attachment_urls] : [];
      const newNames = task.attachment_names ? [...task.attachment_names] : [];

      for (const file of files) {
        const response = await base44.integrations.Core.UploadFile({ file });
        newUrls.push(response.file_url);
        newNames.push(file.name);
      }

      await updateTaskMutation.mutateAsync({
        attachment_urls: newUrls,
        attachment_names: newNames,
      });

      onFilesUpdate?.();
    } catch (error) {
      console.error("Erro ao fazer upload de arquivo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    await uploadFiles(files);
  };

  const handleDeleteFile = async (index) => {
    const newUrls = task.attachment_urls.filter((_, i) => i !== index);
    const newNames = task.attachment_names.filter((_, i) => i !== index);

    await updateTaskMutation.mutateAsync({
      attachment_urls: newUrls.length > 0 ? newUrls : undefined,
      attachment_names: newNames.length > 0 ? newNames : undefined,
    });
  };

  const hasFiles = task.attachment_urls && task.attachment_urls.length > 0;

  return (
    <div className="mt-4 space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${
          isDragActive
            ? "border-[#6FA6FF] bg-[#6FA6FF]/5"
            : "border-[#EAEAEA] bg-[#F7F7F7]"
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`file-input-${task.id}`}
          disabled={isLoading}
        />
        <label
          htmlFor={`file-input-${task.id}`}
          className="flex flex-col items-center justify-center cursor-pointer gap-2 py-2"
        >
          <FileUp className="w-5 h-5 text-[#6FA6FF]" />
          <div className="text-center">
            <p className="text-sm font-medium text-[#131A20]">
              {isDragActive ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para enviar"}
            </p>
            <p className="text-xs text-[#456C8D]">Suporta qualquer tipo de arquivo</p>
          </div>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-[#6FA6FF]/30 border-t-[#6FA6FF] rounded-full animate-spin" />
          )}
        </label>
      </div>

      <AnimatePresence>
        {hasFiles && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-[#456C8D] uppercase tracking-wide">
              Arquivos ({task.attachment_urls.length})
            </p>
            <div className="space-y-2">
              {task.attachment_urls.map((url, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 hover:border-[#6FA6FF] transition-all"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 flex-1 min-w-0 group"
                  >
                    <Download className="w-4 h-4 text-[#456C8D] flex-shrink-0 group-hover:text-[#6FA6FF]" />
                    <span className="text-sm text-[#131A20] truncate group-hover:text-[#6FA6FF] transition-colors">
                      {task.attachment_names?.[index] || `Arquivo ${index + 1}`}
                    </span>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFile(index)}
                    className="h-6 w-6 text-[#456C8D] hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, File, Paperclip } from "lucide-react";

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function AttachmentList({ attachments, moduleId }) {
  const queryClient = useQueryClient();

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id) => base44.entities.ModuleAttachment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-attachments', moduleId] });
    },
  });

  const handleDelete = (attachmentId) => {
    if (window.confirm('Tem certeza que deseja excluir este anexo?')) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <Paperclip className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 mb-2">Nenhum anexo ainda</p>
        <p className="text-slate-500 text-sm">
          Faça upload de documentos, imagens e arquivos relacionados ao módulo
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {attachments.map((attachment, index) => (
          <motion.div
            key={attachment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-slate-900 truncate">
                        {attachment.file_name}
                      </h5>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(attachment.file_size)}
                        </Badge>
                        {attachment.uploaded_by && (
                          <Badge variant="outline" className="text-xs">
                            {attachment.uploaded_by.split('@')[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                      className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(attachment.id)}
                      className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
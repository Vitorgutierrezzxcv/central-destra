import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

export default function AttachmentUploader({ moduleId }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createAttachmentMutation = useMutation({
    mutationFn: (attachmentData) => base44.entities.ModuleAttachment.create(attachmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-attachments', moduleId] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await createAttachmentMutation.mutateAsync({
        module_id: moduleId,
        file_name: file.name,
        file_url: file_url,
        file_size: file.size,
        uploaded_by: currentUser?.email || ""
      });
    } catch (error) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mb-6">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button
          type="button"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg rounded-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Anexar Arquivo
            </>
          )}
        </Button>
      </label>
    </div>
  );
}
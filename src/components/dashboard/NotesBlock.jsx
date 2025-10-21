
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Save, Pencil, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotesBlock({ userEmail }) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['user-notes', userEmail],
    queryFn: () => base44.entities.Note.filter({ user_email: userEmail }),
    initialData: [],
    enabled: !!userEmail,
  });

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.Note.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes', userEmail] });
      setIsEditing(false);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, noteData }) => base44.entities.Note.update(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes', userEmail] });
      setIsEditing(false);
    },
  });

  const userNote = notes.length > 0 ? notes[0] : null;

  const handleEdit = () => {
    setNoteContent(userNote?.content || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (userNote) {
      updateNoteMutation.mutate({
        id: userNote.id,
        noteData: { ...userNote, content: noteContent }
      });
    } else {
      createNoteMutation.mutate({
        content: noteContent,
        user_email: userEmail
      });
    }
  };

  const handleCancel = () => {
    setNoteContent("");
    setIsEditing(false);
  };

  return (
    <Card className="shadow-xl border-none rounded-3xl bg-white/80 backdrop-blur-sm h-fit sticky top-6">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-pink-500" />
            Anotações
          </CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-full"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/5" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Digite suas anotações aqui..."
                  className="min-h-[300px] resize-none rounded-2xl border-slate-200"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-2xl"
                  >
                    {(createNoteMutation.isPending || updateNoteMutation.isPending) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                    className="rounded-2xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="viewing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {userNote?.content ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {userNote.content}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <StickyNote className="w-8 h-8 text-pink-500" />
                    </div>
                    <p className="text-slate-600 text-sm mb-4">
                      Nenhuma anotação ainda
                    </p>
                    <Button
                      onClick={handleEdit}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Criar Anotação
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}

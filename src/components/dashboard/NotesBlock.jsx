
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
    enabled: !!userEmail
  });

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.Note.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes', userEmail] });
      setIsEditing(false);
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, noteData }) => base44.entities.Note.update(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes', userEmail] });
      setIsEditing(false);
    }
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
    <Card className="shadow-xl border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm lg:h-fit lg:sticky lg:top-6">
      <CardHeader className="border-b border-slate-100 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            
            Anotações
          </CardTitle>
          {!isEditing &&
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-7 w-7 md:h-8 md:w-8 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-full">

              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          }
        </div>
      </CardHeader>
      <CardContent className="p-4 md:pt-6">
        {isLoading ?
        <div className="space-y-2">
            <div className="h-3 md:h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 md:h-4 bg-slate-200 rounded animate-pulse w-4/5" />
            <div className="h-3 md:h-4 bg-slate-200 rounded animate-pulse w-3/5" />
          </div> :

        <AnimatePresence mode="wait">
            {isEditing ?
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 md:space-y-4">

                <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Digite suas anotações aqui..."
              className="min-h-[200px] md:min-h-[300px] resize-none rounded-xl md:rounded-2xl border-slate-200 text-sm md:text-base"
              autoFocus />

                <div className="flex gap-2">
                  <Button
                onClick={handleSave}
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl md:rounded-2xl h-9 md:h-10 text-sm md:text-base">

                    {createNoteMutation.isPending || updateNoteMutation.isPending ?
                <>
                        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 animate-spin" />
                        <span className="text-sm md:text-base">Salvando...</span>
                      </> :

                <>
                        <Save className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                        <span className="text-sm md:text-base">Salvar</span>
                      </>
                }
                  </Button>
                  <Button
                variant="outline"
                onClick={handleCancel}
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                className="rounded-xl md:rounded-2xl h-9 md:h-10 text-sm md:text-base px-3 md:px-4">

                    Cancelar
                  </Button>
                </div>
              </motion.div> :

          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>

                {userNote?.content ?
            <div className="prose prose-sm max-w-none">
                    <p className="text-sm md:text-base text-slate-700 whitespace-pre-wrap">
                      {userNote.content}
                    </p>
                  </div> :

            <div className="text-center py-8 md:py-12">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <StickyNote className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
                    </div>
                    <p className="text-slate-600 text-xs md:text-sm mb-3 md:mb-4">
                      Nenhuma anotação ainda
                    </p>
                    <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full h-8 md:h-9 text-xs md:text-sm px-4 md:px-5"
                size="sm">

                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                      Criar Anotação
                    </Button>
                  </div>
            }
              </motion.div>
          }
          </AnimatePresence>
        }
      </CardContent>
    </Card>);

}
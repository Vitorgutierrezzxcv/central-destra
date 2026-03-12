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
    <Card className="border border-[#EAEAEA] rounded-2xl bg-white shadow-none">
      <CardHeader className="border-b border-[#EAEAEA] p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-normal text-[#131A20] flex items-center gap-2">
            Anotações
          </CardTitle>
          {!isEditing &&
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8 text-[#456C8D] hover:text-[#131A20] hover:bg-[#F7F7F7] rounded-xl">

              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          }
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ?
        <div className="space-y-2">
            <div className="h-3 bg-[#EAEAEA] rounded animate-pulse" />
            <div className="h-3 bg-[#EAEAEA] rounded animate-pulse w-4/5" />
            <div className="h-3 bg-[#EAEAEA] rounded animate-pulse w-3/5" />
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
                className="flex-1 bg-[#131A20] hover:bg-[#456C8D] text-white rounded-xl h-9 text-sm font-light border-0 shadow-none">

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
                className="rounded-xl h-9 text-sm font-light px-4 border-[#EAEAEA]">

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
                    <p className="text-sm font-light text-[#131A20] whitespace-pre-wrap leading-relaxed">
                      {userNote.content}
                    </p>
                  </div> :

            <div className="text-center py-10">
                    <div className="w-12 h-12 bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <StickyNote className="w-5 h-5 text-[#456C8D]" />
                    </div>
                    <p className="text-[#456C8D] text-xs font-light mb-4">
                      Nenhuma anotação ainda
                    </p>
                    <Button
                onClick={handleEdit}
                className="bg-[#131A20] hover:bg-[#456C8D] text-white rounded-xl h-9 text-xs font-light px-5 shadow-none border-0"
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
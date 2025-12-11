import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";

export default function ProspectingNotes({ userEmail, dateRange }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteContent, setNoteContent] = useState("");
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['prospecting-notes', userEmail],
    queryFn: () => base44.entities.Note.filter({ user_email: userEmail }),
    initialData: [],
    enabled: !!userEmail,
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.Note.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-notes'] });
      setNoteContent("");
      setShowForm(false);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-notes'] });
    },
  });

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    
    createNoteMutation.mutate({
      content: `<div><strong>Data: ${format(parseISO(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong></div>${noteContent}`,
      user_email: userEmail,
    });
  };

  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <Card className="border-[#EAEAEA]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#131A20] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#6FA6FF]" />
            Estratégias & Anotações
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="bg-[#6FA6FF] hover:bg-[#456C8D] h-8"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota
          </Button>
        </div>
        <p className="text-sm text-[#456C8D]">
          Anote suas estratégias e insights baseados nas métricas
        </p>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-3"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#131A20]">Data de Referência</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-[#EAEAEA]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#131A20]">Anotação</label>
                <div className="border border-[#EAEAEA] rounded-lg overflow-hidden">
                  <ReactQuill
                    value={noteContent}
                    onChange={setNoteContent}
                    placeholder="Digite suas estratégias e observações..."
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setNoteContent("");
                  }}
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveNote}
                  size="sm"
                  className="bg-[#6FA6FF] hover:bg-[#456C8D]"
                  disabled={createNoteMutation.isPending || !noteContent.trim()}
                >
                  {createNoteMutation.isPending ? "Salvando..." : "Salvar Nota"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-[#456C8D]">
              Carregando notas...
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="text-center py-12 bg-[#EAEAEA]/30 rounded-lg">
              <BookOpen className="w-12 h-12 text-[#EAEAEA] mx-auto mb-3" />
              <p className="text-[#456C8D] text-sm">
                Nenhuma nota cadastrada ainda
              </p>
              <p className="text-[#456C8D] text-xs mt-1">
                Comece anotando suas estratégias e insights
              </p>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-[#EAEAEA] rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-[#456C8D]">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(note.created_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div 
                  className="prose prose-sm max-w-none text-[#131A20]"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import {
  PlayCircle, BookOpen, Clock, ChevronLeft, X,
  Loader2, Search, GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryLabel = {
  tutorial: "Tutorial",
  mentoria: "Mentoria",
  treinamento: "Treinamento",
  outro: "Outro",
};

const categoryColor = {
  tutorial:     "bg-blue-50 text-blue-600 border-blue-100",
  mentoria:     "bg-violet-50 text-violet-600 border-violet-100",
  treinamento:  "bg-emerald-50 text-emerald-600 border-emerald-100",
  outro:        "bg-slate-50 text-slate-500 border-slate-200",
};

function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&autoplay=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  // URL direta (mp4, etc)
  return url;
}

function isDirectVideo(url) {
  return url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));
}

function VideoPlayer({ lesson, onClose }) {
  const embedUrl = getEmbedUrl(lesson.video_url);
  const direct = isDirectVideo(lesson.video_url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 bg-black/80 backdrop-blur-sm z-10">
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-snug truncate">{lesson.title}</p>
          {lesson.duration_minutes && (
            <p className="text-white/40 text-xs font-light mt-0.5">{lesson.duration_minutes} min</p>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Player */}
      <div className="flex-1 flex items-center justify-center bg-black">
        {direct ? (
          <video
            src={lesson.video_url}
            controls
            autoPlay
            className="w-full max-h-full"
          />
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={lesson.title}
          />
        )}
      </div>

      {/* Info */}
      {lesson.description && (
        <div className="px-5 py-4 bg-black/80 backdrop-blur-sm">
          <p className="text-white/60 text-sm font-light leading-relaxed line-clamp-2">{lesson.description}</p>
        </div>
      )}
    </motion.div>
  );
}

function LessonCard({ lesson, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-3">
        {lesson.thumbnail_url ? (
          <img
            src={lesson.thumbnail_url}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <PlayCircle className="w-10 h-10 text-white/30" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all duration-300 scale-90 group-hover:scale-100">
            <PlayCircle className="w-7 h-7 text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        {/* Duration badge */}
        {lesson.duration_minutes && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm">
            <span className="text-[10px] text-white font-medium">{lesson.duration_minutes} min</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-900 leading-snug group-hover:text-slate-600 transition-colors">
        {lesson.title}
      </p>
      {lesson.description && (
        <p className="text-xs text-slate-400 font-light mt-1 leading-relaxed line-clamp-2">{lesson.description}</p>
      )}
    </button>
  );
}

export default function ClientPortalCourses() {
  const { callPortalData, userLoading } = useClientPortal();
  const [activeCollection, setActiveCollection] = useState(null);
  const [playingLesson, setPlayingLesson] = useState(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["client_courses"],
    queryFn: () => callPortalData("get_courses").then(d => d || { collections: [], lessons: [] }),
    enabled: !userLoading,
  });

  const collections = data?.collections || [];
  const allLessons = data?.lessons || [];

  const displayedCollection = activeCollection
    ? collections.find(c => c.id === activeCollection)
    : null;

  const lessonsForCollection = useMemo(() => {
    const base = activeCollection
      ? allLessons.filter(l => l.collection_id === activeCollection)
      : allLessons;

    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    );
  }, [activeCollection, allLessons, search]);

  const getLessonsCount = (collectionId) =>
    allLessons.filter(l => l.collection_id === collectionId).length;

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <GraduationCap className="w-12 h-12 text-slate-200 mb-4" />
        <p className="text-slate-400 font-light text-sm">Nenhum conteúdo disponível ainda.</p>
        <p className="text-slate-300 text-xs font-light mt-1">Em breve teremos cursos e mentorias para você.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="w-full px-5 md:px-8 pt-28 md:pt-12 pb-4">
          <div className="flex items-end justify-between gap-4 mb-6">
            {activeCollection ? (
              <div className="flex-1">
                <button
                  onClick={() => { setActiveCollection(null); setSearch(""); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 font-light mb-3 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Todas as coleções
                </button>
                <h1 className="text-5xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-tight">
                  {displayedCollection?.title}
                </h1>
                {displayedCollection?.description && (
                  <p className="text-slate-400 font-light text-sm mt-2 leading-relaxed max-w-lg">
                    {displayedCollection.description}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h1 className="text-7xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-[1.1]">
                  Aprenda
                </h1>
                <p className="text-slate-400 font-light text-sm mt-2">
                  Tutoriais, mentorias e treinamentos
                </p>
              </div>
            )}

            <div className="text-right flex-shrink-0">
              <span className="text-3xl font-extralight text-slate-900">{lessonsForCollection.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                {lessonsForCollection.length === 1 ? "aula" : "aulas"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar aulas..."
              className="w-full h-11 pl-11 pr-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Collections list (home) */}
        {!activeCollection && !search.trim() && (
          <div className="px-5 md:px-8 pb-6">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-4">Coleções</p>
            <div className="space-y-3">
              {collections.map(col => {
                const count = getLessonsCount(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => setActiveCollection(col.id)}
                    className="w-full text-left bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-sm transition-all group flex items-center gap-4"
                  >
                    {/* Icon / Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 flex items-center justify-center">
                      {col.thumbnail_url ? (
                        <img src={col.thumbnail_url} alt={col.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-white/40" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{col.title}</p>
                        {col.category && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${categoryColor[col.category]}`}>
                            {categoryLabel[col.category]}
                          </span>
                        )}
                      </div>
                      {col.description && (
                        <p className="text-xs text-slate-400 font-light line-clamp-1">{col.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <PlayCircle className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] text-slate-400 font-light">{count} {count === 1 ? "aula" : "aulas"}</span>
                      </div>
                    </div>

                    <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lessons grid */}
        {(activeCollection || search.trim()) && (
          <div className="px-5 md:px-8 pb-24">
            {lessonsForCollection.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className="w-10 h-10 text-slate-200 mb-4" />
                <p className="text-slate-400 font-light text-sm">Nenhuma aula encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessonsForCollection.map((lesson, i) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <LessonCard lesson={lesson} onClick={() => setPlayingLesson(lesson)} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quando buscando sem coleção selecionada — mostra resultados de todas as coleções */}
        {!activeCollection && search.trim() && (
          <div className="px-5 md:px-8 pb-24">
            {lessonsForCollection.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className="w-10 h-10 text-slate-200 mb-4" />
                <p className="text-slate-400 font-light text-sm">Nenhuma aula encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessonsForCollection.map((lesson, i) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <LessonCard lesson={lesson} onClick={() => setPlayingLesson(lesson)} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video player fullscreen */}
      <AnimatePresence>
        {playingLesson && (
          <VideoPlayer lesson={playingLesson} onClose={() => setPlayingLesson(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
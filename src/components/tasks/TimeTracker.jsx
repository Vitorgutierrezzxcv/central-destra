import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "0h 0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export default function TimeTracker({ task, compact = false }) {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(task.time_tracked || 0);
  const [isRunning, setIsRunning] = useState(task.is_tracking || false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    },
  });

  // Atualizar tempo em tempo real quando está rastreando
  useEffect(() => {
    let interval;
    if (isRunning && task.last_track_start) {
      interval = setInterval(() => {
        const startTime = new Date(task.last_track_start).getTime();
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTime) / 1000);
        const baseTime = task.time_tracked || 0;
        setCurrentTime(baseTime + elapsedSinceStart);
      }, 1000);
    } else {
      setCurrentTime(task.time_tracked || 0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, task.last_track_start, task.time_tracked]);

  useEffect(() => {
    setIsRunning(task.is_tracking || false);
  }, [task.is_tracking]);

  const handleStartTracking = () => {
    if (!currentUser) return;
    
    updateTaskMutation.mutate({
      id: task.id,
      taskData: {
        ...task,
        is_tracking: true,
        last_track_start: new Date().toISOString(),
        tracking_user: currentUser.email
      }
    });
  };

  const handleStopTracking = () => {
    if (!task.last_track_start) return;

    const startTime = new Date(task.last_track_start).getTime();
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - startTime) / 1000);
    const newTotalTime = (task.time_tracked || 0) + elapsedSinceStart;

    updateTaskMutation.mutate({
      id: task.id,
      taskData: {
        ...task,
        time_tracked: newTotalTime,
        is_tracking: false,
        last_track_start: null,
        tracking_user: null
      }
    });
  };

  const timeEstimate = task.time_estimate || 0;
  const progressPercentage = timeEstimate > 0 
    ? Math.min(Math.round((currentTime / timeEstimate) * 100), 100)
    : 0;
  
  const isOverEstimate = timeEstimate > 0 && currentTime > timeEstimate;
  const isOtherUserTracking = task.is_tracking && currentUser && task.tracking_user !== currentUser.email;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#456C8D]" />
        <span className={`text-sm font-medium ${isRunning ? 'text-[#6FA6FF] animate-pulse' : 'text-[#131A20]'}`}>
          {formatTime(currentTime)}
        </span>
        {timeEstimate > 0 && (
          <span className="text-xs text-[#456C8D]">/ {formatTime(timeEstimate)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-[#EAEAEA]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#456C8D]" />
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${isRunning ? 'text-[#6FA6FF]' : 'text-[#131A20]'}`}>
                {formatTime(currentTime)}
              </span>
              {isRunning && (
                <Badge className="bg-[#6FA6FF] text-white animate-pulse">
                  Rastreando
                </Badge>
              )}
            </div>
            {timeEstimate > 0 && (
              <p className="text-sm text-[#456C8D] mt-1">
                Estimativa: {formatTime(timeEstimate)}
              </p>
            )}
          </div>
        </div>

        {isOtherUserTracking ? (
          <div className="flex items-center gap-2 bg-[#EAEAEA] px-3 py-2 rounded-lg border border-[#EAEAEA]">
            <AlertCircle className="w-4 h-4 text-[#456C8D]" />
            <span className="text-xs text-[#456C8D]">
              Sendo rastreado por outro usuário
            </span>
          </div>
        ) : (
          <Button
            onClick={isRunning ? handleStopTracking : handleStartTracking}
            disabled={updateTaskMutation.isPending}
            className={`${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-[#6FA6FF] hover:bg-[#456C8D]'
            } rounded-lg text-white`}
            size="sm"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
        )}
      </div>

      {timeEstimate > 0 && (
        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isOverEstimate ? '[&>div]:bg-red-500' : ''}`}
          />
          <div className="flex justify-between text-xs text-[#456C8D]">
            <span>{progressPercentage}% da estimativa</span>
            {isOverEstimate && (
              <span className="text-red-600 font-medium">
                +{formatTime(currentTime - timeEstimate)} acima
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

const MODES = {
  focus: { label: "Foco", minutes: 25, color: "#6FA6FF" },
  short: { label: "Pausa curta", minutes: 5, color: "#456C8D" },
  long: { label: "Pausa longa", minutes: 15, color: "#131A20" },
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState("focus");
  const [seconds, setSeconds] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const total = MODES[mode].minutes * 60;
  const progress = ((total - seconds) / total) * 100;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
    // Create beep sound via AudioContext
    audioRef.current = { beep };
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            beep();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.2);
    } catch (_) {}
  }

  function switchMode(m) {
    setMode(m);
    setSeconds(MODES[m].minutes * 60);
    setRunning(false);
  }

  function reset() {
    setSeconds(MODES[mode].minutes * 60);
    setRunning(false);
  }

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-normal text-[#131A20]">Pomodoro</h2>
          <p className="text-xs font-light text-[#456C8D] mt-0.5">{MODES[mode].label}</p>
        </div>
        <Coffee className="w-4 h-4 text-[#456C8D]" />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-5">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-1.5 rounded-xl text-[11px] font-light transition-all ${
              mode === key
                ? "bg-[#131A20] text-white"
                : "bg-[#F7F7F7] text-[#456C8D] hover:bg-[#EAEAEA]"
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Circle timer */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="#EAEAEA"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={MODES[mode].color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-light text-[#131A20] tabular-nums tracking-tight">
              {mins}:{secs}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="w-9 h-9 rounded-xl bg-[#F7F7F7] hover:bg-[#EAEAEA] flex items-center justify-center transition-all"
          >
            <RotateCcw className="w-4 h-4 text-[#456C8D]" />
          </button>
          <button
            onClick={() => setRunning(!running)}
            className="w-14 h-10 rounded-xl flex items-center justify-center transition-all font-light text-sm text-white"
            style={{ background: MODES[mode].color }}
          >
            {running
              ? <Pause className="w-4 h-4" />
              : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
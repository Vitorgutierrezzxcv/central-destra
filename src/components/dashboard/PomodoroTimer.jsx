import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

const MODES = {
  focus: { label: "Foco", minutes: 25, color: "#6FA6FF" },
  short: { label: "Pausa curta", minutes: 5, color: "#456C8D" },
  long: { label: "Pausa longa", minutes: 15, color: "#EAEAEA" },
};

export default function PomodoroTimer({ dark = false }) {
  const [mode, setMode] = useState("focus");
  const [seconds, setSeconds] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const total = MODES[mode].minutes * 60;
  const progress = ((total - seconds) / total) * 100;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
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

  const circumference = 2 * Math.PI * 56;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const textColor = dark ? "text-white" : "text-[#131A20]";
  const subColor = dark ? "text-white/50" : "text-[#456C8D]";
  const tabBg = dark ? "bg-white/10 hover:bg-white/20 text-white/70" : "bg-[#F7F7F7] text-[#456C8D] hover:bg-[#EAEAEA]";
  const tabActive = dark ? "bg-white text-[#131A20]" : "bg-[#131A20] text-white";
  const resetBg = dark ? "bg-white/10 hover:bg-white/20" : "bg-[#F7F7F7] hover:bg-[#EAEAEA]";
  const resetIcon = dark ? "text-white/60" : "text-[#456C8D]";

  return (
    <div className="flex flex-col items-center flex-1">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-sm font-normal ${textColor}`}>Pomodoro</h2>
          <p className={`text-xs font-light ${subColor} mt-0.5`}>{MODES[mode].label}</p>
        </div>
        <Coffee className={`w-4 h-4 ${subColor}`} />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 w-full mb-8">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-light transition-all ${mode === key ? tabActive : tabBg}`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Circle timer — large */}
      <div className="relative w-44 h-44 mb-8">
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" fill="none" stroke={dark ? "rgba(255,255,255,0.1)" : "#EAEAEA"} strokeWidth="6" />
          <circle
            cx="64" cy="64" r="56"
            fill="none"
            stroke={MODES[mode].color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-light tabular-nums tracking-tight ${textColor}`}>
            {mins}:{secs}
          </span>
          <span className={`text-[11px] font-light mt-1 ${subColor}`}>{MODES[mode].label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${resetBg}`}
        >
          <RotateCcw className={`w-4 h-4 ${resetIcon}`} />
        </button>
        <button
          onClick={() => setRunning(!running)}
          className="w-20 h-11 rounded-2xl flex items-center justify-center transition-all text-white text-sm font-light gap-2"
          style={{ background: MODES[mode].color }}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          {running ? "Pausar" : "Iniciar"}
        </button>
      </div>
    </div>
  );
}
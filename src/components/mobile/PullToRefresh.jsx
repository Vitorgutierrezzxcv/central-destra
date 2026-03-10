import React, { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70; // px to pull before refresh triggers

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) {
      startY.current = null;
      return;
    }
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    startY.current = null;
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const indicatorVisible = pullDistance > 10;

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-container overflow-y-auto h-full ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {indicatorVisible && (
        <div
          className="flex items-center justify-center py-3 text-blue-500"
          style={{
            transform: `translateY(${pullDistance - 48}px)`,
            transition: refreshing ? "transform 0.2s ease" : "none",
            height: 48,
            marginTop: -48,
          }}
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${progress * 360}deg)`,
              transition: refreshing ? "none" : "transform 0.1s",
            }}
          />
          <span className="ml-2 text-sm font-medium text-slate-500">
            {refreshing ? "Atualizando..." : progress >= 1 ? "Solte para atualizar" : "Puxe para atualizar"}
          </span>
        </div>
      )}

      {/* Actual content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: refreshing || pullDistance === 0 ? "transform 0.2s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
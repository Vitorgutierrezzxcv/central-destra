import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function DateRangeFilter({ onDateRangeChange }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState(null);

  const presets = [
    {
      id: "today",
      label: "Hoje",
      getRange: () => {
        const today = new Date();
        return {
          start: format(startOfDay(today), 'yyyy-MM-dd'),
          end: format(endOfDay(today), 'yyyy-MM-dd')
        };
      }
    },
    {
      id: "week",
      label: "Esta Semana",
      getRange: () => {
        const today = new Date();
        return {
          start: format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'),
          end: format(endOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd')
        };
      }
    },
    {
      id: "month",
      label: "Este Mês",
      getRange: () => {
        const today = new Date();
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      }
    }
  ];

  const handlePresetClick = (preset) => {
    const range = preset.getRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(preset.id);
    onDateRangeChange(range.start, range.end);
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    setActivePreset(null);
    if (value && endDate) {
      onDateRangeChange(value, endDate);
    } else if (!value && !endDate) {
      onDateRangeChange(null, null);
    }
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    setActivePreset(null);
    if (startDate && value) {
      onDateRangeChange(startDate, value);
    } else if (!startDate && !value) {
      onDateRangeChange(null, null);
    }
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setActivePreset(null);
    onDateRangeChange(null, null);
  };

  const hasActiveFilter = startDate || endDate || activePreset;

  return (
    <Card className="bg-white dark:bg-[#161b22] border border-[#EAEAEA] dark:border-[#30363d] mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#456C8D] dark:text-[#8b949e]" />
            <Label className="text-sm font-medium text-[#131A20] dark:text-white">Filtrar por Data</Label>
          </div>
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-[#456C8D] dark:text-[#8b949e] hover:text-red-500 h-8 text-xs"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map(preset => (
            <Button
              key={preset.id}
              variant={activePreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className={`h-8 text-xs ${
                activePreset === preset.id
                  ? 'bg-[#6FA6FF] hover:bg-[#456C8D] text-white'
                  : 'hover:bg-[#EAEAEA] dark:hover:bg-[#21262d] border-[#EAEAEA] dark:border-[#30363d] dark:text-white'
              }`}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start-date" className="text-xs text-[#456C8D] dark:text-[#8b949e]">
              Data de Início
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-date" className="text-xs text-[#456C8D] dark:text-[#8b949e]">
              Data de Término
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDate}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Active Filter Display */}
        {hasActiveFilter && (
          <div className="mt-3 p-2 bg-[#6FA6FF]/10 rounded-lg border border-[#6FA6FF]/30">
            <p className="text-xs text-[#456C8D] dark:text-[#8b949e]">
              <strong>Período ativo:</strong>{" "}
              {activePreset ? (
                presets.find(p => p.id === activePreset)?.label
              ) : (
                <>
                  {startDate && format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })}
                  {startDate && endDate && " - "}
                  {endDate && format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
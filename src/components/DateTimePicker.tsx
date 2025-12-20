"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import * as React from "react";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DateTimePicker = ({
  value,
  onChange,
  placeholder = "Selecione data e hora",
  disabled = false,
  minDate,
  maxDate,
  className,
}: DateTimePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(value);
  const [hours, setHours] = React.useState<number>(
    value ? value.getHours() : 0
  );
  const [minutes, setMinutes] = React.useState<number>(
    value ? value.getMinutes() : 0
  );

  // Sincronizar com value externo
  React.useEffect(() => {
    if (value && value instanceof Date && !isNaN(value.getTime())) {
      setSelectedDate(value);
      setHours(value.getHours());
      setMinutes(value.getMinutes());
    } else {
      setSelectedDate(null);
      setHours(0);
      setMinutes(0);
    }
  }, [value]);

  // Resetar quando o popover fecha sem confirmar
  React.useEffect(() => {
    if (!open && value) {
      // Restaurar valores originais quando fecha sem confirmar
      if (value instanceof Date && !isNaN(value.getTime())) {
        setSelectedDate(value);
        setHours(value.getHours());
        setMinutes(value.getMinutes());
      }
    }
  }, [open, value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Criar nova data mantendo a hora selecionada
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
    } else {
      // Se desmarcar a data, limpar tudo
      setSelectedDate(null);
      setHours(0);
      setMinutes(0);
    }
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newHours, newMinutes, 0, 0);
      setSelectedDate(newDate);
    }
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(hours, minutes, 0, 0);
      onChange(finalDate);
      setOpen(false);
    } else {
      // Se não há data selecionada, permitir confirmar para limpar
      onChange(null);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    setHours(0);
    setMinutes(0);
    onChange(null);
    setOpen(false);
  };

  const displayValue = selectedDate
    ? format(selectedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : placeholder;

  // Gerar arrays de horas e minutos
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 max-w-[90vw] sm:max-w-none z-10000"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Calendário */}
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-200">
            <Calendar
              mode="single"
              selected={
                selectedDate
                  ? new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate()
                    )
                  : undefined
              }
              onSelect={handleDateSelect}
              initialFocus
              disabled={
                minDate || maxDate
                  ? (date) => {
                      const dateToCompare = new Date(date);
                      dateToCompare.setHours(0, 0, 0, 0);

                      if (minDate) {
                        const minDateStart = new Date(minDate);
                        minDateStart.setHours(0, 0, 0, 0);
                        if (dateToCompare < minDateStart) return true;
                      }
                      if (maxDate) {
                        const maxDateEnd = new Date(maxDate);
                        maxDateEnd.setHours(23, 59, 59, 999);
                        const maxDateToCompare = new Date(date);
                        maxDateToCompare.setHours(23, 59, 59, 999);
                        if (maxDateToCompare > maxDateEnd) return true;
                      }
                      return false;
                    }
                  : undefined
              }
            />
          </div>

          {/* Seletor de Hora */}
          <div className="p-3 flex flex-col w-full sm:w-auto sm:min-w-[180px] max-w-full">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Hora</span>
            </div>

            <div className="flex gap-2 justify-center items-start">
              {/* Horas */}
              <div className="flex flex-col items-center shrink-0">
                <label className="text-xs text-gray-500 mb-1">Hora</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto w-14">
                  {hoursArray.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleTimeChange(hour, minutes)}
                      className={cn(
                        "w-full px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
                        hours === hour &&
                          "bg-blue-900 text-white hover:bg-blue-800"
                      )}
                    >
                      {String(hour).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Separador */}
              <div className="flex items-center pt-6 shrink-0">
                <span className="text-gray-400 text-lg">:</span>
              </div>

              {/* Minutos */}
              <div className="flex flex-col items-center shrink-0">
                <label className="text-xs text-gray-500 mb-1">Minuto</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto w-14">
                  {minutesArray.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleTimeChange(hours, minute)}
                      className={cn(
                        "w-full px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
                        minutes === minute &&
                          "bg-blue-900 text-white hover:bg-blue-800"
                      )}
                    >
                      {String(minute).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hora atual selecionada */}
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500 mb-1">Hora selecionada</p>
              <p className="text-sm font-semibold text-gray-900">
                {String(hours).padStart(2, "0")}:
                {String(minutes).padStart(2, "0")}
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Limpar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleConfirm}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

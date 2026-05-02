import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number | null;
  onChange: (value: any) => void;
  options: Option[];
  placeholder: string;
  hasError?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder, hasError }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-full flex items-center justify-between px-4 text-sm font-semibold bg-white outline-none transition-all border-2 
        ${
          hasError
            ? "border-red-500 shadow-[3px_3px_0px_#fca5a5]"
            : isOpen
            ? "border-primary shadow-[4px_4px_0px_#E2B9A1]"
            : "border-slate-300 shadow-[3px_3px_0px_#cbd5e1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] hover:border-primary/50"
        }
        dark:bg-slate-900 dark:border-slate-700 dark:shadow-[3px_3px_0px_#334155]`}
      >
        <span className={selectedOption ? "text-slate-900 dark:text-white" : "text-slate-400 font-medium"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border-2 border-slate-200 shadow-[4px_4px_0px_#cbd5e1] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 dark:bg-slate-800 dark:border-slate-700">
          <ul className="py-1">
            <li
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 dark:hover:bg-slate-700/50"
            >
              {placeholder}
            </li>
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors
                  ${
                    opt.value === value
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-primary/5 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-700"
                  }
                `}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------------------
// Custom DateTime Picker
// --------------------------------------------------------------------------------------

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hasError?: boolean;
}

export function CustomDateTimePicker({ value, onChange, placeholder, hasError }: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal state for calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Parse current value
  const selectedDate = value ? new Date(value) : null;
  const [selectedHour, setSelectedHour] = useState(selectedDate ? selectedDate.getHours() : 12);
  const [selectedMinute, setSelectedMinute] = useState(selectedDate ? selectedDate.getMinutes() : 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, selectedHour, selectedMinute);
    // Adjust to local ISO string (hacky way to get YYYY-MM-DDThh:mm)
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(newDate.getTime() - offset).toISOString().slice(0, 16);
    onChange(localISOTime);
    setIsOpen(false);
  };

  const updateTime = (h: number, m: number) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    if (selectedDate) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m);
      const offset = newDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(newDate.getTime() - offset).toISOString().slice(0, 16);
      onChange(localISOTime);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  // Adjust so Monday is first (0=Mon, 6=Sun)
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: emptyDays }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatDisplay = (val: string) => {
    if (!val) return "";
    const d = new Date(val);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-full flex items-center justify-between px-4 text-sm font-semibold bg-white outline-none transition-all border-2 
        ${
          hasError
            ? "border-red-500 shadow-[3px_3px_0px_#fca5a5]"
            : isOpen
            ? "border-primary shadow-[4px_4px_0px_#E2B9A1]"
            : "border-slate-300 shadow-[3px_3px_0px_#cbd5e1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] hover:border-primary/50"
        }
        dark:bg-slate-900 dark:border-slate-700 dark:shadow-[3px_3px_0px_#334155]`}
      >
        <span className={value ? "text-slate-900 dark:text-white" : "text-slate-400 font-medium"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarIcon className={`w-4 h-4 transition-colors ${isOpen ? "text-primary" : "text-slate-400"}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-[320px] bg-white border-2 border-slate-200 shadow-[4px_4px_0px_#cbd5e1] animate-in fade-in slide-in-from-top-2 dark:bg-slate-800 dark:border-slate-700">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-primary/5">
            <button type="button" onClick={prevMonth} className="p-1 text-slate-500 hover:text-primary hover:bg-white rounded transition-colors"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 text-slate-500 hover:text-primary hover:bg-white rounded transition-colors"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                <div key={day} className="text-[10px] font-black text-slate-400 uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {blanks.map((b) => <div key={`blank-${b}`} className="h-8"></div>)}
              {days.map((day) => {
                const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth() && selectedDate?.getFullYear() === currentMonth.getFullYear();
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-none transition-all
                      ${isSelected ? "bg-primary text-white shadow-[2px_2px_0px_#E2B9A1]" : ""}
                      ${!isSelected && isToday ? "border border-primary text-primary" : ""}
                      ${!isSelected && !isToday ? "text-slate-700 hover:bg-primary/10 hover:text-primary dark:text-slate-300" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
                <ClockIcon className="w-3.5 h-3.5" /> Thời gian
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedHour}
                  onChange={(e) => updateTime(parseInt(e.target.value), selectedMinute)}
                  className="bg-white border-2 border-slate-200 text-xs font-bold p-1 outline-none focus:border-primary cursor-pointer shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => updateTime(selectedHour, parseInt(e.target.value))}
                  className="bg-white border-2 border-slate-200 text-xs font-bold p-1 outline-none focus:border-primary cursor-pointer shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

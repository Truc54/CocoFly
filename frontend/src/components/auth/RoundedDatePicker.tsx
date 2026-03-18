"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["H", "B", "T", "N", "S", "B", "C"];
const MONTH_OPTIONS = [
  { value: 0, label: "Tháng 1" },
  { value: 1, label: "Tháng 2" },
  { value: 2, label: "Tháng 3" },
  { value: 3, label: "Tháng 4" },
  { value: 4, label: "Tháng 5" },
  { value: 5, label: "Tháng 6" },
  { value: 6, label: "Tháng 7" },
  { value: 7, label: "Tháng 8" },
  { value: 8, label: "Tháng 9" },
  { value: 9, label: "Tháng 10" },
  { value: 10, label: "Tháng 11" },
  { value: 11, label: "Tháng 12" },
];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const leadingDays = startWeekday === 0 ? 6 : startWeekday - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: Array<{ date: Date; outside: boolean }> = [];

  for (let index = leadingDays; index > 0; index--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - index + 1),
      outside: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ date: new Date(year, month, day), outside: false });
  }

  while (days.length < 42) {
    const nextDay = days.length - (leadingDays + daysInMonth) + 1;
    days.push({ date: new Date(year, month + 1, nextDay), outside: true });
  }

  return days;
}

export default function RoundedDatePicker() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const [activePicker, setActivePicker] = useState<"month" | "year" | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 90 }, (_, index) => currentYear - index);
  }, []);
  const selectedKey = selectedDate ? toDateKey(selectedDate) : "";
  const todayKey = toDateKey(new Date());

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setActivePicker(null);
          setIsOpen((prev) => !prev);
        }}
        className="relative h-10 w-full cursor-pointer rounded-lg border border-primary/15 bg-slate-50/80 px-3.5 text-left text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-primary/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-slate-200"
      >
        <span className={selectedDate ? "text-slate-700 dark:text-slate-200" : "text-slate-500"}>
          {selectedDate ? formatDisplayDate(selectedDate) : "dd/mm/yyyy"}
        </span>
        <Calendar className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-700 dark:text-slate-200" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+2px)] z-30 w-[290px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-xl shadow-black/15 dark:bg-background-dark">
          <div className="flex items-center justify-between border-b border-primary/10 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePicker((current) => (current === "month" ? null : "month"))}
                  className="inline-flex h-8 min-w-[106px] items-center justify-between gap-2 rounded-lg border border-primary/15 bg-slate-50/90 px-2.5 text-sm font-bold text-slate-800 outline-none transition-colors hover:border-primary/30"
                >
                  {MONTH_OPTIONS[viewDate.getMonth()].label}
                  <ChevronDown className={cn("size-4 transition-transform", activePicker === "month" && "rotate-180")} />
                </button>

                {activePicker === "month" && (
                  <div className="absolute left-0 top-[calc(100%+2px)] z-40 max-h-44 w-[120px] overflow-y-auto rounded-lg border border-primary/20 bg-white shadow-lg shadow-black/10 dark:bg-background-dark">
                    {MONTH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setViewDate((current) => new Date(current.getFullYear(), option.value, 1));
                          setActivePicker(null);
                        }}
                        className={cn(
                          "block w-full px-2.5 py-1.5 text-left text-sm font-semibold transition-colors",
                          option.value === viewDate.getMonth()
                            ? "bg-primary/10 text-primary"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePicker((current) => (current === "year" ? null : "year"))}
                  className="inline-flex h-8 min-w-[78px] items-center justify-between gap-2 rounded-lg border border-primary/15 bg-slate-50/90 px-2.5 text-sm font-bold text-slate-800 outline-none transition-colors hover:border-primary/30"
                >
                  {viewDate.getFullYear()}
                  <ChevronDown className={cn("size-4 transition-transform", activePicker === "year" && "rotate-180")} />
                </button>

                {activePicker === "year" && (
                  <div className="absolute left-0 top-[calc(100%+2px)] z-40 max-h-44 w-[92px] overflow-y-auto rounded-lg border border-primary/20 bg-white shadow-lg shadow-black/10 dark:bg-background-dark">
                    {yearOptions.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setViewDate((current) => new Date(year, current.getMonth(), 1));
                          setActivePicker(null);
                        }}
                        className={cn(
                          "block w-full px-2.5 py-1.5 text-left text-sm font-semibold transition-colors",
                          year === viewDate.getFullYear()
                            ? "bg-primary/10 text-primary"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActivePicker(null);
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
                }}
                className="inline-flex size-7 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Tháng trước"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePicker(null);
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
                }}
                className="inline-flex size-7 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Tháng sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="px-3.5 pb-2 pt-2.5">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-center text-xs font-semibold text-slate-500">
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, outside }) => {
                const key = toDateKey(date);
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActivePicker(null);
                      setSelectedDate(date);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                      outside
                        ? "text-slate-400"
                        : "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
                      isToday && !isSelected && "font-bold text-primary",
                      isSelected && "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-primary/10 px-3.5 py-2.5">
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setViewDate(today);
                setIsOpen(false);
              }}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

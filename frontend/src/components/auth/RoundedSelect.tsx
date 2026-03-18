"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type RoundedSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
  className?: string;
};

export default function RoundedSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
}: RoundedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 w-full cursor-pointer rounded-lg border border-primary/15 bg-slate-50/80 px-3.5 text-left text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-primary/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-slate-200"
      >
        <span className={selectedOption ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+2px)] z-30 w-full overflow-hidden rounded-lg border border-primary/20 bg-white shadow-lg shadow-black/10 dark:bg-background-dark">
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "block w-full cursor-pointer px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

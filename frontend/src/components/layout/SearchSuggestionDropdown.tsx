"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface SuggestionItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  currentPrice?: number;
  scheduledStart?: string;
}

interface SearchSuggestionDropdownProps {
  isOpen: boolean;
  suggestions: SuggestionItem[];
  history: string[];
  isLoading: boolean;
  query: string;
  searchStatus: "active" | "scheduled";
  onSelectSuggestion: (suggestion: SuggestionItem) => void;
  onSelectHistory: (term: string) => void;
  onRemoveHistory: (term: string) => void;
  onClearHistory: () => void;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function formatScheduledStart(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${hours}:${minutes} — ${day}/${month}`;
}

export default function SearchSuggestionDropdown({
  isOpen,
  suggestions,
  history,
  isLoading,
  query,
  searchStatus,
  onSelectSuggestion,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
}: SearchSuggestionDropdownProps) {
  if (!isOpen) return null;

  const showSuggestions = query.trim().length >= 2;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] z-50 overflow-hidden max-h-[420px] overflow-y-auto rounded-2xl">
      {/* ── Suggestions Mode ── */}
      {showSuggestions ? (
        <>
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-primary animate-spin mb-2 block w-max mx-auto">
                progress_activity
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Đang tìm kiếm...
              </p>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className={isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 dark:hover:bg-slate-700/50 transition-colors text-left"
                  >
                    {/* Thumbnail — LEFT */}
                    <div className="w-12 h-12 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg text-slate-400">
                            image
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info — RIGHT: 2 rows */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Title */}
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-snug">
                        {item.title}
                      </p>
                      {/* Row 2: Price or Time */}
                      {item.currentPrice !== undefined && (
                        <p className="text-xs font-bold text-primary mt-0.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">Giá hiện tại:</span>
                          {formatVND(item.currentPrice)}
                        </p>
                      )}
                      {item.scheduledStart && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          <span>Thời gian diễn ra:</span>
                          <span className="font-bold">{formatScheduledStart(item.scheduledStart)}</span>
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">
                search_off
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </>
      ) : (
        /* ── History Mode (text only) ── */
        <>
          {history.length > 0 ? (
            <>
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Lịch sử tìm kiếm
                </span>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wide"
                >
                  Xóa tất cả
                </button>
              </div>
              <ul>
                {history.map((term) => (
                  <li key={term}>
                    <div className="flex items-center group hover:bg-primary/5 dark:hover:bg-slate-700/50 transition-colors">
                      <button
                        type="button"
                        onClick={() => onSelectHistory(term)}
                        className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-left min-w-0"
                      >
                        <span className="material-symbols-outlined text-base text-slate-400 shrink-0">
                          history
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {term}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveHistory(term)}
                        className="px-3 py-2.5 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        aria-label={`Xóa "${term}"`}
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="px-4 py-5 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600 mb-1 block">
                manage_search
              </span>
              <p className="text-xs text-slate-400">
                Chưa có lịch sử tìm kiếm
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

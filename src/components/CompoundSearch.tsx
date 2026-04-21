"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, Loader2, X, ChevronRight } from "lucide-react";
import { autocompleteCompoundNames } from "@/lib/pubchem";
import { SearchHistory } from "./SearchHistory";

interface CompoundSearchProps {
  onSelectTerm: (term: string) => void;
  isLoading: boolean;
}

export const CompoundSearch = ({ onSelectTerm, isLoading }: CompoundSearchProps) => {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fetchingSuggest, setFetchingSuggest] = useState(false);
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSuggestions = useDebouncedCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 2) {
      setSuggestions([]);
      setFetchingSuggest(false);
      return;
    }
    setFetchingSuggest(true);
    const list = await autocompleteCompoundNames(t, 8);
    setSuggestions(list);
    setFetchingSuggest(false);
    setHighlightedIndex(-1);
  }, 250);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = useCallback((term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    setText(trimmed);
    setOpen(false);
    setSuggestions([]);
    setShowHistory(false);
    onSelectTerm(trimmed);
  }, [onSelectTerm]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 2 || isLoading) return;
    setShowHistory(false);
    
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      pick(suggestions[highlightedIndex]);
      return;
    }
    
    if (suggestions.length === 1) {
      pick(suggestions[0]);
      return;
    }
    if (suggestions.length > 1) {
      const hit = suggestions.find(s => s.toLowerCase() === trimmed.toLowerCase());
      pick(hit ?? trimmed);
      return;
    }
    pick(trimmed);
  };

  const handleClear = () => {
    setText("");
    setSuggestions([]);
    setShowHistory(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || (suggestions.length === 0 && !showHistory)) return;

    const items = showHistory ? [] : suggestions;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      pick(items[highlightedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  const hasDropdown = (suggestions.length > 0 && !showHistory) || showHistory;

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
      <div ref={wrapRef} className="relative">
        {/* Search Input Container */}
        <div
          className={`relative z-50 flex items-center bg-white rounded-2xl border transition-all duration-200 ${
            open && hasDropdown
              ? "border-amber-300 ring-4 ring-amber-500/10 shadow-xl shadow-amber-500/10"
              : "border-gray-200 shadow-lg shadow-gray-200/50 hover:border-gray-300"
          }`}
        >
          {/* Search Icon */}
          <div className="pl-5 pr-3">
            {isLoading || fetchingSuggest ? (
              <Loader2 size={20} className="text-amber-500 shrink-0 animate-spin" />
            ) : (
              <Search size={20} className="text-gray-400 shrink-0" />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            id="chemical-search"
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              setText(v);
              setOpen(true);
              setShowHistory(v.trim().length === 0);
              loadSuggestions(v);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              setOpen(true);
              setShowHistory(text.trim().length === 0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search for a chemical compound..."
            className="flex-1 py-4 bg-transparent text-gray-900 placeholder-gray-400 text-base outline-none"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Right side actions */}
          <div className="flex items-center gap-2 pr-3">
            {/* Clear button */}
            {text && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || text.trim().length < 2}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-xl
                         hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">{isLoading ? "Loading..." : "Search"}</span>
              <ChevronRight size={16} className="sm:hidden" />
            </button>
          </div>
        </div>

        {/* Search History */}
        <SearchHistory
          isVisible={showHistory && !isLoading && open}
          onSelect={(term) => {
            setText(term);
            pick(term);
          }}
          onClose={() => setShowHistory(false)}
        />

        {/* Suggestions Dropdown - z-50 to ensure visibility */}
        {open && suggestions.length > 0 && !showHistory && (
          <ul
            className="absolute z-[100] left-0 right-0 top-full mt-2 py-2 rounded-xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 overflow-hidden"
            role="listbox"
          >
            {suggestions.map((s, idx) => (
              <li key={s}>
                <button
                  type="button"
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                    idx === highlightedIndex
                      ? "bg-amber-50 text-amber-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => pick(s)}
                >
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="hidden sm:inline">Press</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-sans text-[10px]">/</kbd>
          <span>to search</span>
        </p>
        <span className="text-gray-300">·</span>
        <p className="text-xs text-gray-400">
          {fetchingSuggest ? "Loading suggestions..." : "Type to see suggestions"}
        </p>
      </div>
    </form>
  );
};

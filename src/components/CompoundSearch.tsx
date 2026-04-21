"use client";

import { useState, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, Loader2, X } from "lucide-react";
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
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadSuggestions = useDebouncedCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 2) {
      setSuggestions([]);
      setFetchingSuggest(false);
      return;
    }
    setFetchingSuggest(true);
    const list = await autocompleteCompoundNames(t, 10);
    setSuggestions(list);
    setFetchingSuggest(false);
  }, 300);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    setText(trimmed);
    setOpen(false);
    setSuggestions([]);
    onSelectTerm(trimmed);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 2 || isLoading) return;
    setShowHistory(false);
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
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
      <div ref={wrapRef} className="relative">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white
                     focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300
                     transition-shadow shadow-sm"
        >
          {isLoading || fetchingSuggest ? (
            <Loader2 size={18} className="text-gray-500 shrink-0 animate-spin" />
          ) : (
            <Search size={18} className="text-gray-400 shrink-0" />
          )}

          <input
            type="text"
            id="chemical-search"
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              setText(v);
              setOpen(true);
              setShowHistory(v.trim().length === 0);
              loadSuggestions(v);
            }}
            onFocus={() => {
              setOpen(true);
              setShowHistory(text.trim().length === 0);
            }}
            placeholder="Start typing a compound name…"
            className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm outline-none font-medium"
            autoComplete="off"
            spellCheck={false}
          />

          {text && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || text.trim().length < 2}
            className="shrink-0 bg-gray-900 text-white text-sm font-medium px-4 py-1.5 rounded-lg
                       hover:bg-gray-800 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? "Loading…" : "Load sheet"}
          </button>
        </div>

        {/* Search History - shown when focused and empty */}
        <SearchHistory
          isVisible={showHistory && !isLoading}
          onSelect={(term) => {
            setText(term);
            pick(term);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />

        {/* Suggestions - shown when typing */}
        {open && suggestions.length > 0 && !showHistory && (
          <ul
            className="absolute z-20 left-0 right-0 top-full mt-1 py-1 rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto"
            role="listbox"
          >
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowHistory(false);
                    pick(s);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-gray-400 text-xs mt-2.5">
        Suggestions update as you type · Press / to focus · Recent searches shown when empty
      </p>
    </form>
  );
};

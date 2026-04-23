"use client";

import { useState, useEffect } from "react";
import { getSearchHistory, deleteSearchHistoryItem, clearSearchHistory, SearchHistoryItem } from "@/lib/cache";
import { reorderFormula } from "@/lib/formulaUtils";
import { Clock, X, Trash2, History, Beaker } from "lucide-react";

interface SearchHistoryProps {
  onSelect: (term: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function SearchHistory({ onSelect, isVisible, onClose }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [isVisible]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const items = await getSearchHistory(8);
      setHistory(items);
    } catch (error) {
      console.warn("Failed to load search history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteSearchHistoryItem(id);
      await loadHistory();
    } catch (error) {
      console.warn("Failed to delete history item:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearSearchHistory();
      setHistory([]);
    } catch (error) {
      console.warn("Failed to clear history:", error);
    }
  };

  const handleSelect = (term: string) => {
    onSelect(term);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute z-[100] left-0 right-0 top-full mt-2 rounded-xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <History size={14} className="text-amber-500" />
          <span className="font-medium">Recent Searches</span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all history"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <ul className="max-h-64 overflow-y-auto py-1">
        {isLoading ? (
          <li className="px-4 py-8 text-sm text-gray-400 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
              <span>Loading history...</span>
            </div>
          </li>
        ) : history.length === 0 ? (
          <li className="px-4 py-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <Beaker size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No recent searches</p>
              <p className="text-xs text-gray-400">Your search history will appear here</p>
            </div>
          </li>
        ) : (
          history
            .filter((item): item is SearchHistoryItem => 
              item != null && 
              typeof item === "object" && 
              typeof item.id === "string" &&
              typeof item.term === "string"
            )
            .map((item) => (
            <li 
              key={item.id} 
              className="group flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 transition-colors cursor-pointer"
              onClick={() => handleSelect(item.term)}
            >
              <Clock size={14} className="text-gray-400 shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.name || item.term}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {item.cas && (
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      CAS {item.cas}
                    </span>
                  )}
                  {item.formula && (
                    <span className="font-mono text-gray-500">{reorderFormula(item.formula)}</span>
                  )}
                  {(item.cas || item.formula) && (
                    <span className="text-gray-300">·</span>
                  )}
                  <span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <button
                onClick={(e) => item?.id && handleDelete(e, item.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="Remove from history"
              >
                <X size={14} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

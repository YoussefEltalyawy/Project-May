"use client";

import { useState, useEffect } from "react";
import { getSearchHistory, deleteSearchHistoryItem, clearSearchHistory, SearchHistoryItem } from "@/lib/cache";
import { Clock, X, Trash2, History } from "lucide-react";

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
      const items = await getSearchHistory(10);
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

  if (!isVisible || history.length === 0) return null;

  return (
    <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <History size={14} />
          <span className="font-medium">Recent Searches</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearAll}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all history"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <ul className="max-h-56 overflow-y-auto py-1">
        {isLoading ? (
          <li className="px-4 py-3 text-sm text-gray-400 text-center">
            Loading...
          </li>
        ) : history.length === 0 ? (
          <li className="px-4 py-6 text-sm text-gray-400 text-center">
            No recent searches
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
            <li key={item.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <button
                type="button"
                className="flex-1 flex items-center gap-3 text-left min-w-0"
                onClick={() => {
                  onSelect(item.term);
                  onClose();
                }}
              >
                <Clock size={14} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name || item.term}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {item.cas && (
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        CAS {item.cas}
                      </span>
                    )}
                    {item.formula && (
                      <span className="font-mono">{item.formula}</span>
                    )}
                    <span className="text-gray-300">•</span>
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => item?.id && handleDelete(e, item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (item?.id) {
                      handleDelete(e as unknown as React.MouseEvent, item.id);
                    }
                  }
                }}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                title="Remove from history"
              >
                <X size={14} />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

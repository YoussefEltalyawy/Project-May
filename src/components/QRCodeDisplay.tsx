"use client";

import { X } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function QRCodeDisplay({ url, title, onClose }: QRCodeDisplayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center justify-between">
          <h3 className="text-white font-semibold">Share Link</h3>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            Direct link to <span className="font-medium text-gray-900">{title}</span>
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <code className="text-xs text-gray-600 break-all block">{url}</code>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              onClose();
            }}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}

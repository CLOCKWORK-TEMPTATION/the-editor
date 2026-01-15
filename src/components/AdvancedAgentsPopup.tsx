/**
 * AdvancedAgentsPopup Component
 * A popup dialog for advanced AI agents functionality
 */

import * as React from 'react';

interface AdvancedAgentsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export default function AdvancedAgentsPopup({ isOpen, onClose, content }: AdvancedAgentsPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[600px] max-h-[80vh] overflow-auto shadow-2xl shadow-black/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">الوكلاء المتقدمة</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="text-white/70">
          <p>محتوى الوكلاء المتقدمة قيد التطوير...</p>
          <p className="mt-2 text-sm">عدد الأحرف: {content.length}</p>
        </div>
      </div>
    </div>
  );
}

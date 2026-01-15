/**
 * ExportDialog Component
 * A dialog for exporting the screenplay in various formats
 */

import * as React from 'react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

export default function ExportDialog({ isOpen, onClose, content, title }: ExportDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[500px] shadow-2xl shadow-black/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">تصدير {title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all">
            تصدير بصيغة PDF
          </button>
          <button className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all">
            تصدير بصيغة DOCX
          </button>
          <button className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all">
            تصدير بصيغة TXT
          </button>
        </div>
      </div>
    </div>
  );
}

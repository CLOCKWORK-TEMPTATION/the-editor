/**
 * MainHeader Component
 * The main header for the editor with save and undo functionality
 */

import * as React from 'react';

interface MainHeaderProps {
  onSave: () => void;
  onUndo: () => void;
}

export default function MainHeader({ onSave, onUndo }: MainHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-xl">
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
          title="تراجع"
        >
          ↶
        </button>
        <button
          onClick={onSave}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-sm"
          title="حفظ"
        >
          حفظ
        </button>
      </div>
    </div>
  );
}

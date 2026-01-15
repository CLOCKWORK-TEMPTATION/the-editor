/**
 * ExportDialog Component
 * Placeholder - يمكن تطويره لاحقاً
 */

import React from 'react';

interface ExportDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  content?: string;
  title?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="export-dialog">
      <h2>Export Screenplay</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default ExportDialog;

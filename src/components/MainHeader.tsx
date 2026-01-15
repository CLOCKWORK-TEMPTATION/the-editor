/**
 * MainHeader Component
 * Placeholder - يمكن تطويره لاحقاً
 */

import React from 'react';

interface MainHeaderProps {
  title?: string;
  onSave?: () => void;
  onUndo?: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({ title = "محرر السيناريو" }) => {
  return (
    <header className="main-header">
      <h1>{title}</h1>
    </header>
  );
};

export default MainHeader;

import React from 'react';

interface BlockActionsProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const BlockActions: React.FC<BlockActionsProps> = ({ isOpen, onClose, position }) => {
  if (!isOpen) return null;

  const actions = [
    { icon: "💬", label: "Comment", shortcut: "⌘M" },
    { icon: "✏️", label: "Suggest", shortcut: "⌘⇧X" },
    { icon: "🤖", label: "Ask AI", shortcut: "⌘J" },
    { icon: "🗑️", label: "Delete", shortcut: "Del" },
    { icon: "📋", label: "Duplicate", shortcut: "⌘D" },
    { icon: "🔄", label: "Turn into" },
    { icon: "🔗", label: "Copy link to block", shortcut: "⌘^L" },
    { icon: "📍", label: "Move to", shortcut: "⌘⇧P" },
    { icon: "🎨", label: "Color" },
  ];

  return (
    <div 
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-1 min-w-[220px]"
      style={{ 
        top: position.y,
        left: Math.max(0, position.x - 260), // Subtract the min-width to position it to the left
      }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between group"
        >
          <span className="flex items-center gap-2">
            <span>{action.icon}</span>
            <span className="text-sm text-foreground">{action.label}</span>
          </span>
          {action.shortcut && (
            <span className="text-xs text-muted-foreground">{action.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default BlockActions;
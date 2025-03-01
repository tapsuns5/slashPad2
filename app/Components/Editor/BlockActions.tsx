import React from 'react';
import { Editor } from '@tiptap/react';

interface BlockActionsProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  editor: Editor;
}

const BlockActions: React.FC<BlockActionsProps> = ({ isOpen, onClose, position, editor }) => {
  if (!isOpen) return null;

  const handleDelete = () => {
    console.log('Delete clicked');
    
    const { selection } = editor.state;
    console.log('Current selection:', {
      type: selection.constructor.name,
      from: selection.from,
      to: selection.to
    });
    
    // Handle node selection
    if (selection.$from.depth > 0) {
      const pos = selection.$from.before();
      const node = editor.state.doc.nodeAt(pos);
      
      console.log('Deleting node:', {
        type: node?.type.name,
        pos,
        content: node?.textContent
      });
      
      editor.chain()
        .focus()
        .command(({ tr }) => {
          if (pos !== undefined) {
            const from = selection.$from.before();
            const to = selection.$from.after();
            tr.delete(from, to);
          }
          return true;
        })
        .run();
    }
    
    onClose();
  };

  const handleDuplicate = () => {
    console.log('Duplicate clicked');
    
    // Select the parent node again to ensure we have the right selection
    editor.commands.selectParentNode();
    
    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);
    
    console.log('Duplicate action:', {
      from,
      to,
      nodeType: node?.type.name,
      nodeText: node?.textContent
    });

    if (node) {
      const content = editor.state.doc.slice(from, to);
      editor.commands.insertContentAt(to, content.toJSON());
    }
    onClose();
  };

  const actions = [
    { icon: "💬", label: "Comment", shortcut: "⌘M" },
    { icon: "✏️", label: "Suggest", shortcut: "⌘⇧X" },
    { icon: "🤖", label: "Ask AI", shortcut: "⌘J" },
    { icon: "🗑️", label: "Delete", shortcut: "Del", onClick: handleDelete },
    { icon: "📋", label: "Duplicate", shortcut: "⌘D", onClick: handleDuplicate },
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
        left: Math.max(0, position.x - 260),
      }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between group"
          onClick={action.onClick ? () => action.onClick() : undefined}
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
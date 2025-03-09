import React from 'react';
import { Editor } from '@tiptap/react';
import { Trash2, CopyPlus, RefreshCw } from 'lucide-react';

interface BlockActionsProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  editor: Editor;
  selectedNodePos: number | null;
}

const BlockActions: React.FC<BlockActionsProps> = ({ isOpen, onClose, position, editor, selectedNodePos }) => {
  if (!isOpen) return null;

  const handleDelete = () => {
    console.log('Delete clicked');
    
    if (!editor || selectedNodePos === null) {
      console.error('Editor or position not available:', { editor: !!editor, pos: selectedNodePos });
      return;
    }
    
    try {
      console.log('Attempting to delete node at position:', selectedNodePos);
      
      // Get the node at the position
      const node = editor.state.doc.nodeAt(selectedNodePos);
      if (!node) {
        console.error('No node found at position');
        return;
      }
      
      console.log('Found node:', {
        type: node.type.name,
        content: node.textContent
      });

      // Get the $pos
      const $pos = editor.state.doc.resolve(selectedNodePos);
      
      // Find the closest parent node that can be deleted
      let depth = $pos.depth;
      let from = selectedNodePos;
      let to = selectedNodePos + node.nodeSize;
      
      while (depth > 0) {
        if ($pos.node(depth).type.spec.group === 'block') {
          from = $pos.before(depth);
          to = $pos.after(depth);
          break;
        }
        depth -= 1;
      }
      
      console.log('Deleting range:', { from, to, depth });

      // Chain commands for reliable deletion
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .run();
      
      console.log('Node deleted successfully');
    } catch (error) {
      console.error('Error deleting node:', error);
    }
    
    onClose();
  };

  const handleDuplicate = () => {
    console.log('Duplicate clicked');
    
    if (!editor || selectedNodePos === null) {
      console.error('Editor or position not available:', { editor: !!editor, pos: selectedNodePos });
      return;
    }
    
    try {
      console.log('Attempting to duplicate node at position:', selectedNodePos);
      
      // Get the node at the position
      const node = editor.state.doc.nodeAt(selectedNodePos);
      if (!node) {
        console.error('No node found at position');
        return;
      }
      
      // Get the $pos
      const $pos = editor.state.doc.resolve(selectedNodePos);
      
      // Find the closest parent node that can be duplicated
      let depth = $pos.depth;
      let from = selectedNodePos;
      let to = selectedNodePos + node.nodeSize;
      
      while (depth > 0) {
        if ($pos.node(depth).type.spec.group === 'block') {
          from = $pos.before(depth);
          to = $pos.after(depth);
          break;
        }
        depth -= 1;
      }
      
      console.log('Duplicating range:', { from, to, depth });

      // Get the slice of content to duplicate
      const slice = editor.state.doc.slice(from, to);
      
      // Create a transaction
      const tr = editor.state.tr;
      
      // Insert the slice at the target position
      tr.insert(to, slice.content);
      
      // Dispatch the transaction
      editor.view.dispatch(tr);
      
      console.log('Node duplicated successfully');
    } catch (error) {
      console.error('Error duplicating node:', error);
    }
    
    onClose();
  };

  const actions = [
    { 
      icon: <Trash2 size={18} strokeWidth={1.5} />, 
      label: "Delete", 
      shortcut: "Del", 
      onClick: handleDelete
    },
    { 
      icon: <CopyPlus size={18} strokeWidth={1.5} />, 
      label: "Duplicate", 
      shortcut: "⌘D", 
      onClick: handleDuplicate
    },
    { icon: <RefreshCw size={18} strokeWidth={1.5} />, label: "Turn into", onClick: () => console.log('Turn into clicked') },
  ];

  return (
    <div 
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-1 min-w-[220px]"
      style={{ 
        top: position.y,
        left: Math.max(0, position.x - 260),
        userSelect: 'none',
      }}
      data-block-actions-open="true"
      onClick={(e) => {
        console.log('Menu container clicked');
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          type="button"
          className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between group"
          style={{ cursor: 'pointer' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent, #f3f4f6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Action triggered:', action.label);
            if (action.onClick) {
              action.onClick();
            }
          }}
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
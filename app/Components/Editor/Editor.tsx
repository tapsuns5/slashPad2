"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import DragHandle from '@tiptap-pro/extension-drag-handle-react'
import { useParams } from 'next/navigation';
import BlockActions from './BlockActions';
import { createGlobalStyle } from 'styled-components';

// Dynamically import EditorContent with SSR disabled
const EditorContent = dynamic(() => import("./EditorContent"), { 
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

interface EditorProps {
  editorRef?: React.RefObject<Editor | null>;
  isSidebarOpen?: boolean;
  extensions?: Extension[];
  content?: string;
  noteId?: string;
}

const GlobalStyle = createGlobalStyle`
  .ProseMirror-focused .is-dragging *,
  .ProseMirror-focused .is-dragging,
  .drag-handle.is-dragging,
  .ProseMirror.dragging * {
    cursor: grabbing !important;
  }
  
  /* Add styles for BlockActions */
  [data-block-actions-open="true"] button {
    cursor: pointer !important;
  }
  
  [data-block-actions-open="true"] button:hover {
    background-color: var(--accent) !important;
  }
`;

const EditorComponent: React.FC<EditorProps> = ({ 
  editorRef, 
  isSidebarOpen = false, 
  extensions, 
  content 
}) => {
  const localEditorRef = React.useRef<Editor | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null);
  const dragHandleRef = React.useRef<HTMLDivElement>(null);
  const params = useParams();
  const [noteId, setNoteId] = React.useState<number | null>(null);
  const [showActions, setShowActions] = React.useState(false);
  const [actionPosition, setActionPosition] = React.useState({ x: 0, y: 0 });
  const currentNodeRef = React.useRef<{ pos: number; nodeType: string } | null>(null);
  const [selectedNodePos, setSelectedNodePos] = React.useState<number | null>(null);

  // Move all useEffect hooks together
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const fetchNoteId = async () => {
      if (params.slug) {
        try {
          const response = await fetch(`/api/notes/${params.slug}`);
          const data = await response.json();
          if (data.id) {
            setNoteId(data.id);
          }
        } catch (error) {
          console.error('Error fetching note:', error);
        }
      }
    };

    fetchNoteId();
  }, [params.slug]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActions && !dragHandleRef.current?.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!editorInstance) return;
    
    if ((e.key === 'Delete' || e.key === 'Backspace') && editorInstance.state.selection.constructor.name === 'NodeSelection') {
      e.preventDefault();
      const { selection } = editorInstance.state;
      const from = selection.$from.before();
      const to = selection.$from.after();
      
      editorInstance.chain()
        .focus()
        .command(({ tr }) => {
          tr.delete(from, to);
          return true;
        })
        .run();
    }
  };

  // Only render on client
  if (!isClient) {
    return null;
  }

  // Use the provided ref if it exists, otherwise use the local ref
  const finalEditorRef = editorRef || localEditorRef;

  const handleEditorReady = (editor: Editor) => {
    setEditorInstance(editor);
    if (finalEditorRef) {
      finalEditorRef.current = editor;
    }
  };

  const handleDragHandleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    const rect = dragHandleRef.current?.getBoundingClientRect();
    if (rect) {
      // Remove previous highlight
      document.querySelectorAll('.selected-node').forEach(el => {
        el.classList.remove('selected-node');
      });

      // Add highlight to the current node
      const currentNode = editorInstance?.view.domAtPos(editorInstance.state.selection.from)?.node;
      if (currentNode && currentNode.parentElement) {
        currentNode.parentElement.classList.add('selected-node');
      }

      // Store the position
      if (currentNodeRef.current) {
        setSelectedNodePos(currentNodeRef.current.pos);
        editorInstance?.commands.setNodeSelection(currentNodeRef.current.pos);
      }

      // Position the menu with a slight offset to ensure it's not covered by other elements
      setActionPosition({
        x: rect.right + 15, // Increased offset
        y: rect.top,
      });
      setShowActions(true);
      
      // Force a style update on the document to ensure BlockActions styling is applied
      document.body.classList.add('block-actions-visible');
      setTimeout(() => document.body.classList.remove('block-actions-visible'), 0);
    }
  };

  console.log('DragHandle rendered:', !!editorInstance); // Add this to check if DragHandle is rendering

  return (
    <>
      <GlobalStyle />
      <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-0" : "ml-0"}`}>
        <EditorContent 
          editorRef={handleEditorReady}
          onKeyDown={handleKeyDown}
          extensions={extensions}
          content={content}
          noteId={noteId || undefined}
          className="[&.dragging-active]:cursor-grabbing"
        />
        {editorInstance && (
          <>
            <DragHandle 
              editor={editorInstance}
              className="drag-handle custom-drag-handle [&.dragging]:cursor-grabbing"
              onNodeChange={({ node, pos }) => {
                if (!node) return;
                
                currentNodeRef.current = { 
                  pos,
                  nodeType: node.type.name 
                };
                
                console.log('🔍 onNodeChange:', {
                  type: node.type.name,
                  text: node.textContent,
                  pos,
                  stored: currentNodeRef.current
                });
              }}
            >
              <div 
                ref={dragHandleRef}
                onClick={handleDragHandleClick}
                className="hover:cursor-pointer active:cursor-grabbing [&.dragging]:cursor-grabbing w-6 h-6"
                style={{ backgroundColor: 'transparent' }}
              />
            </DragHandle>
            <BlockActions
              isOpen={showActions}
              onClose={() => {
                setShowActions(false);
                setSelectedNodePos(null);
              }}
              position={actionPosition}
              editor={editorInstance}
              selectedNodePos={selectedNodePos}
            />
          </>
        )}
      </div>
    </>
  );
};

export default EditorComponent;

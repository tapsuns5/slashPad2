"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import DragHandle from '@tiptap-pro/extension-drag-handle-react'

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
  const lastSelectionRef = React.useRef<{from: number, to: number} | null>(null);

  // Hardcoded test noteId for development
  const TEST_NOTE_ID = 'test-note-001';

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (editorInstance) {
      if (isSidebarOpen) {
        // Save selection when sidebar opens
        const { from, to } = editorInstance.state.selection;
        lastSelectionRef.current = { from, to };
      } else if (lastSelectionRef.current) {
        // Restore selection when sidebar closes
        requestAnimationFrame(() => {
          editorInstance.commands.setTextSelection(lastSelectionRef.current!);
          lastSelectionRef.current = null;
        });
      }
    }
  }, [isSidebarOpen, editorInstance]);

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

  return (
    <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-0" : "ml-0"}`}>
      <EditorContent 
        editorRef={handleEditorReady} 
        extensions={extensions}
        content={content}
        noteId={TEST_NOTE_ID} // Use the hardcoded test note ID
      />
      {editorInstance && (
        <DragHandle 
          editor={editorInstance}
          className="drag-handle custom-drag-handle"
        >
          <div ref={dragHandleRef} />
        </DragHandle>
      )}
    </div>
  );
};

export default EditorComponent;

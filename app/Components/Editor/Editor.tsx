"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import DragHandle from '@tiptap-pro/extension-drag-handle-react'
import { useParams } from 'next/navigation';

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
  const params = useParams();
  const [noteId, setNoteId] = React.useState<number | null>(null);


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
        noteId={noteId || undefined}
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

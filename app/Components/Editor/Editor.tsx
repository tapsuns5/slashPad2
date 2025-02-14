"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";

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
}

const EditorComponent: React.FC<EditorProps> = ({ 
  editorRef, 
  isSidebarOpen = false, 
  extensions, 
  content 
}) => {
  const localEditorRef = React.useRef<Editor | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client
  if (!isClient) {
    return null;
  }

  // Use the provided ref if it exists, otherwise use the local ref
  const finalEditorRef = editorRef || localEditorRef;

  return (
    <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-0" : "ml-0"}`}>
      <EditorContent 
        editorRef={finalEditorRef} 
        extensions={extensions}
        content={content}
      />
    </div>
  );
};

export default EditorComponent;

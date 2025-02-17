"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  useEditor,
  EditorContent as TipTapContent,
  Editor,
  Extension,
} from "@tiptap/react";
import {
  Calendar as CalendarIcon,
  Tag as TagIcon,
  Share as ShareIcon,
} from "lucide-react";
import { COMMANDS } from "./CommandMenu";
import BubbleMenuComponent from './BubbleMenu';
import CommandMenu, { executeCommand } from './CommandMenu';
import { Badge } from "@/components/ui/badge";
import { initializeClipboardCopy } from "@/app/utils/clipboardCopy";
import editorExtensions from "./EditorExtensions";

// Define types for node attributes and details
type NodeAttributes = {
  uid?: string;  // Optional UID
  level?: number;  // For headings
  checked?: boolean;  // For task list items
  [key: string]: string | number | boolean | undefined;  // Allow other potential attributes
};

type NodeDetail = {
  type: string;
  position: number;
  content: string;
  attributes: NodeAttributes & {
    hasUID: boolean;
  };
};

type NodeWithAttributes = {
  type: string;
  position: number;
  attributes: NodeAttributes;
  hasUID: boolean;
  uidValue?: string;
};

interface EditorContentProps {
  className?: string;
  editorRef: ((editor: Editor) => void) | React.RefObject<Editor | null>;
  extensions?: Extension[];
  content?: string;
  noteId?: string;
}

// Define a specific type for block metadata
type BlockMetadata = {
  lastEditedAt?: string;
  contentType?: string;
  position?: number;
  tags?: string[];
  attributes?: Record<string, string | number | boolean>;
  createdBy?: string;
  [key: string]: unknown; // Allow some flexibility for future extensions
};

const saveBlockContent = async (
  blockPayload: {
    content: string;
    noteId: string;
    metadata?: BlockMetadata;
  }
) => {
  // Validate payload before sending
  if (!blockPayload.content) {
    console.warn('Attempted to save with null or undefined content');
    return null;
  }

  if (!blockPayload.noteId) {
    console.warn('Attempted to save block without a noteId');
    return null;
  }

  // Prepare metadata for backend
  const metadata: BlockMetadata = {
    lastEditedAt: new Date().toISOString(),
    contentType: 'text', // Default content type
    ...(blockPayload.metadata || {}) // Spread existing metadata
  };

  // Create final payload with standardized metadata
  const finalPayload = {
    ...blockPayload,
    metadata
  };

  // Log the full payload details
  console.log('Detailed block payload:', {
    content: finalPayload.content,
    contentLength: finalPayload.content.length,
    noteId: finalPayload.noteId,
    metadata: JSON.stringify(finalPayload.metadata),
    contentType: typeof finalPayload.content
  });

  try {
    const response = await fetch('/api/blocks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload)
    });

    console.log('Save response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Check for non-OK responses before parsing
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save block error response text:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.error('Parsed error data:', errorData);
        
        // Throw a more informative error
        throw new Error(
          errorData.details?.message || 
          errorData.error || 
          'Failed to save block'
        );
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
    }

    // Safely parse JSON
    try {
      const newBlock = await response.json();
      console.log('Block saved successfully:', newBlock);
      return newBlock;
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      console.log('Response text:', await response.text());
      throw new Error('Failed to parse server response');
    }
  } catch (error) {
    console.error('Error saving block:', error);
    throw error;
  }
};

const EditorContent: React.FC<EditorContentProps> = ({
  editorRef,
  className,
  extensions,
  content,
  noteId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Use state for title with initial value
  const [title, setTitle] = useState("Untitled Page");
  const [isEditing, setIsEditing] = useState(false);
  const [showCommandList, setShowCommandList] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  // const [commands, setCommands] = useState<Command[]>(COMMANDS);
  // const [dragHandle, setDragHandle] = useState(false);
  
  // Format current date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // State to track saving status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Debug logging for noteId
  useEffect(() => {
    console.log('EditorContent noteId:', noteId);
    
    // Validate noteId
    const validateNote = async () => {
      if (!noteId) {
        console.error('No noteId provided');
        setSaveError('No note ID available');
        return;
      }

      try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
          console.error('Note does not exist:', noteId);
          setSaveError(`Note with ID ${noteId} not found`);
        }
      } catch (error) {
        console.error('Error validating note:', error);
        setSaveError('Failed to validate note');
      }
    };

    validateNote();
  }, [noteId]);

  const autoSaveContent = useCallback(async (content: string) => {
    console.log('Auto save triggered:', {
      contentLength: content.length,
      noteId,
      rawContent: content,
      contentType: typeof content,
      contentIsNull: content === null,
      contentIsUndefined: content === undefined
    });

    // Prevent saving if noteId is not available
    if (!noteId) {
      console.warn('No noteId provided, skipping save');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      // Ensure content is a string and create a valid payload
      const contentToSave = content || '<p></p>';
      const blockPayload = {
        content: contentToSave,
        noteId: noteId,
        metadata: {
          lastEditedAt: new Date().toISOString(),
          contentType: contentToSave === '<p></p>' ? 'empty_paragraph' : 'text'
        }
      };

      console.log('Block payload:', JSON.stringify(blockPayload, null, 2));

      await saveBlockContent(blockPayload);
    } catch (error) {
      console.error('Block save failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }, [noteId]);

  const editor = useEditor({
    extensions: extensions || editorExtensions,
    content: content || "<p></p>", // Use provided content or default
    onCreate: ({ editor }) => {
      // Log all available node types
      const nodeTypes = new Set<string>();
      const nodeDetails: NodeDetail[] = [];
      editor.state.doc.descendants((node, pos) => {
        nodeTypes.add(node.type.name);
        nodeDetails.push({
          type: node.type.name,
          position: pos,
          content: node.textContent || '',
          attributes: {
            ...node.attrs as NodeAttributes,
            hasUID: !!node.attrs.uid
          }
        });
      });
      console.log('Available Node Types:', Array.from(nodeTypes));
      console.log('Node Details:', nodeDetails);

      // Detailed extension logging
      const extensionDetails = editor.extensionManager.extensions.map(ext => ({
        name: ext.name,
        type: ext.constructor.name,
        options: ext.options
      }));
      console.log('All Extensions:', extensionDetails);

      // Comprehensive node traversal with detailed logging
      const nodesWithAttributes: NodeWithAttributes[] = [];
      editor.state.doc.descendants((node, pos) => {
        nodesWithAttributes.push({
          type: node.type.name,
          position: pos,
          attributes: node.attrs as NodeAttributes,
          hasUID: !!node.attrs.uid,
          uidValue: node.attrs.uid
        });
      });

      console.log('Node Attributes Debug:', nodesWithAttributes);

      // Specific UniqueID extension logging
      const uniqueIDExtension = editor.extensionManager.extensions.find(ext => ext.name === 'uniqueID');
      if (uniqueIDExtension) {
        console.log('UniqueID Extension Details:', {
          name: uniqueIDExtension.name,
          options: uniqueIDExtension.options
        });
      } else {
        console.warn('UniqueID Extension NOT FOUND');
      }

      // Attempt to manually add UIDs
      editor.state.doc.descendants((node) => {
        console.log('Node Type Inspection:', {
          type: node.type.name,
          attrs: node.attrs,
          hasUID: node.attrs.uid !== undefined
        });
      });
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      
      console.log('Editor content updated:', {
        contentLength: content.length,
        noteId
      });

      // Only update localStorage and attempt save on client-side
      if (typeof window !== 'undefined' && noteId) {
        // Save to local storage
        localStorage.setItem(`editorContent-${noteId}`, content);
        
        // Automatically save to database
        autoSaveContent(content);
      }
    },
    immediatelyRender: false, // Add this line to resolve SSR hydration warning
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none prose-ul:list-disc prose-ul:text-black [&>*]:mb-2",
        spellcheck: "false",
        "data-gramm": "false", // Disable Grammarly
        "data-gramm_editor": "false",
        "data-enable-grammarly": "false",
      },
      handleKeyDown: () => {
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor) {
      // Handle both ref types
      if (typeof editorRef === 'function') {
        editorRef(editor);
      } else if (editorRef && 'current' in editorRef) {
        editorRef.current = editor;
      }

      // Focus the editor
      editor.commands.focus();
    }
  }, [editor, editorRef]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setShowCommandList(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!editor) return;

      if (event.key === "/") {
        setCommandInput("");
        setShowCommandList(true);
      } else if (showCommandList) {
        if (event.key === "Escape") {
          setShowCommandList(false);
          setCommandInput("");
        } else if (event.key === "Backspace") {
          event.preventDefault();
          setCommandInput(prev => {
            const newValue = prev.slice(0, -1);
            if (newValue === "") {
              setShowCommandList(false);
            }
            return newValue;
          });
        } else if (event.key === "Enter") {
          event.preventDefault();
          const filteredCommands = COMMANDS.filter(command =>
            command.label.toLowerCase().includes(commandInput.toLowerCase())
          );
          if (filteredCommands.length > 0) {
            executeCommand(filteredCommands[0], editor);
            setShowCommandList(false);
            setCommandInput("");
          }
        } else if (event.key.length === 1) { // Single character keys
          event.preventDefault();
          setCommandInput(prev => prev + event.key);
        }
      }
    },
    [showCommandList, commandInput, editor]
  );

  useEffect(() => {
    //Initialize clipboard copy functionality
    initializeClipboardCopy();
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem("editorTitle", title);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem("editorTitle", title);
      }
    }
  };

  // Render saving status
  const renderSavingStatus = () => {
    if (isSaving) {
      return <div className="text-gray-500 text-sm">Saving...</div>;
    }
    if (saveError) {
      return <div className="text-red-500 text-sm">Save failed: {saveError}</div>;
    }
    return null;
  };

  // Only render on client
  if (!isClient || !editor) {
    return null;
  }

  return (
    <div ref={containerRef} className={`${className} touch-none`}>
      <div className="mb-2">
        {isEditing ? (
          <div className="relative w-full">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="pl-14 w-[60%] text-2xl font-bold focus:outline-none border-b-2 border-gray-100 pb-2"
              style={{ backgroundColor: 'transparent' }}
              autoFocus
            />
            <div className="absolute top-0 right-0 flex items-center space-x-3 mr-6">
              <CalendarIcon 
                className="text-gray-800 hover:text-gray-600 cursor-pointer" 
                size={20} 
                strokeWidth={1}
              />
              <TagIcon 
                className="text-gray-800 hover:text-gray-600 cursor-pointer" 
                size={20} 
                strokeWidth={1}
              />
              <ShareIcon 
                className="text-gray-800 hover:text-gray-600 cursor-pointer" 
                size={20} 
                strokeWidth={1}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h1
              onClick={handleTitleClick}
              className="pl-14 text-3xl font-bold cursor-text pb-0 text-gray-600 bg-transparent w-[60%]"
            >
              {title}
            </h1>
            <div className="flex items-center space-x-6 mr-20">
              <CalendarIcon 
                className="text-gray-800 hover:text-gray-600 cursor-pointer" 
                size={17} 
                strokeWidth={1.5}
              />
              <TagIcon 
                className="text-gray-800 hover:text-gray-600 cursor-pointer" 
                size={17} 
                strokeWidth={1.5}
              />
              <ShareIcon 
                className="text-gray-800 hover:text-gray-600 cursor-pointer" 
                size={17} 
                strokeWidth={1.5}
              />
            </div>
          </div>
        )}
        <div className=" pl-[3.6rem] text-gray-400 text-xs -mt-1">{formattedDate} </div>
        <div className=" pl-[3.6rem] text-gray-600 text-xs -mt-1">Tags:
          <Badge variant="outline" className="ml-5 mt-3">Tag</Badge>
        </div>
        <div className=" pl-[3.6rem] text-gray-600 text-xs -mt-1">Meeting:
          <Badge variant="outline" className="ml-5 mt-3">Meeting</Badge>
        </div>
      </div>
      <TipTapContent 
        editor={editor} 
        className={className} 
      />
      {editor && <BubbleMenuComponent editor={editor} />}
      {showCommandList && (
        <CommandMenu
          isVisible={showCommandList}
          onSelectCommand={() => setShowCommandList(false)}
          onClose={() => setShowCommandList(false)}
          editor={editor}
          filterValue={commandInput}
        />
      )}
      {renderSavingStatus()}
    </div>
  );
};

export default EditorContent;

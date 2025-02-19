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
import { v4 as uuidv4 } from 'uuid';

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
  noteId?: number;
}

// Define precise types for block and content
type BlockMetadata = {
  contentType?: string;
  lastEditedAt?: string;
};

type Block = {
  id?: string;
  content?: string | {
    content?: string;
    [key: string]: unknown;
  };
  metadata?: BlockMetadata;
  updatedAt?: string;
  noteId?: string;
};

// Robust useDebounce hook with improved type handling
const useDebounce = <T,>(
  value: T, 
  delay: number, 
  options: { 
    leading?: boolean 
  } = {}
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const { leading = false } = options;

  useEffect(() => {
    // If value is undefined or null and not leading, return early
    if ((value === undefined || value === null) && !leading) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, leading]);

  return debouncedValue;
};

const updateBlockContent = async (
  blockPayload: {
    content: string;
    noteId: string;
    id?: string;
    slug: string;
    metadata?: BlockMetadata;
  }
) => {
  // Comprehensive payload validation
  console.log('Attempting to update block with payload:', blockPayload);

  if (!blockPayload) {
    console.error('No payload provided');
    return null;
  }

  // Validate payload before sending
  if (!blockPayload.content) {
    console.warn('Attempted to save with null or undefined content');
    return null;
  }

  if (!blockPayload.noteId) {
    console.warn('Attempted to save block without a noteId');
    return null;
  }

  if (!blockPayload.slug) {
    console.warn('Attempted to save block without a slug');
    return null;
  }

  // Prepare metadata for backend
  const metadata: BlockMetadata = {
    lastEditedAt: new Date().toISOString(),
    contentType: 'text', // Default content type
    ...(blockPayload.metadata || {}) // Spread existing metadata
  };

  // Create final payload with standardized metadata and content
  const finalPayload = {
    content: blockPayload.content,
    noteId: blockPayload.noteId,
    slug: blockPayload.slug,
    metadata
  };

  console.log('Final payload for block update:', finalPayload);

  try {
    const response = await fetch('/api/blocks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update block error response:', {
        status: response.status,
        errorText,
        payload: finalPayload
      });

      // Additional error handling
      if (response.status === 404) {
        throw new Error('Block not found');
      } else if (response.status === 400) {
        throw new Error('Invalid block data');
      } else {
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
    }

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      const updatedBlock = responseData.block;
      
      console.log('Block updated successfully:', updatedBlock);
      return updatedBlock;
    } else {
      const responseText = await response.text();
      console.warn('Non-JSON response:', responseText);
      return null;
    }
  } catch (error) {
    console.error('Comprehensive error updating block:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      payload: finalPayload
    });
    throw error;
  }
};

type BlockPayload = {
  content: string;
  noteId: number;
  slug: string;
  id?: string;
  metadata: {
    lastEditedAt: string;
    contentType: string;
  };
  type: string;
  order: number;
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
  const [previousTitle, setPreviousTitle] = useState("");
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

    // Fetch initial title when component mounts
    const fetchTitle = async () => {
      if (!noteId) return;

      try {
        const response = await fetch(`/api/notes?noteId=${noteId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.title) {
            setTitle(data.title);
            setPreviousTitle(data.title);
          }
        }
      } catch (error) {
        console.error('Error fetching title:', error);
      }
    };

    fetchTitle();
  }, [noteId]);

  // State to track saving status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);


  // State to track the current block ID
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);

  const autoSaveContent = useCallback(async (contentToSave: string) => {
    if (!noteId) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      // Retrieve the last saved block ID from localStorage
      const lastBlockId = localStorage.getItem(`lastBlockId-${noteId}`);

      const blockUid = uuidv4();
      const blockPayload: BlockPayload = {
        content: contentToSave,
        noteId: noteId,
        slug: blockUid,
        metadata: {
          lastEditedAt: new Date().toISOString(),
          contentType: contentToSave === '<p></p>' ? 'empty_paragraph' : 'text'
        },
        type: 'text',
        order: 0
      };

      // If we have a last block ID, add it to the payload
      if (lastBlockId) {
        blockPayload.id = lastBlockId;
      }

      console.log('Block Payload for Saving:', {
        contentLength: contentToSave.length,
        contentType: typeof contentToSave,
        noteId,
        currentBlockId,
        blockPayload: JSON.stringify(blockPayload, null, 2)
      });

      // Attempt to save or update the block
      const updatedBlock = await updateBlockContent({
        ...blockPayload,
        noteId: String(blockPayload.noteId)  // Convert number to string
      });

      // Store the block ID in localStorage for future updates
      if (updatedBlock?.id) {
        localStorage.setItem(`lastBlockId-${noteId}`, updatedBlock.id);
        setCurrentBlockId(updatedBlock.id);
      }
    } catch (error) {
      console.error('Block save failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }, [noteId, currentBlockId]);

  // State to track the current content for debouncing
  const [currentContent, setCurrentContent] = useState<string>('');

  // Debounce the content changes
  const debouncedContent = useDebounce(currentContent, 500);

  // Effect to trigger auto-save when debounced content changes
  useEffect(() => {
    if (debouncedContent && noteId) {
      autoSaveContent(debouncedContent);
    }
  }, [debouncedContent, noteId, autoSaveContent]);

  // Sanitize content before saving
  const sanitizeContent = useCallback((content: string) => {
    // Remove data-uid attributes to prevent JSON parsing issues
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const elementsWithUid = tempDiv.querySelectorAll('[data-uid]');
    elementsWithUid.forEach(el => el.removeAttribute('data-uid'));
    
    // Trim and handle empty content
    const sanitizedContent = tempDiv.innerHTML.trim() || '<p></p>';
    
    console.log('Sanitized Content:', {
      originalLength: content.length,
      sanitizedLength: sanitizedContent.length,
      sanitizedContent
    });
    
    return sanitizedContent;
  }, []);

  const onEditorUpdate = useCallback(({ editor }: { editor: Editor }) => {
    const content = editor.getHTML();
    
    console.log('Editor content updated:', {
      contentLength: content?.length || 0,
      noteId,
      content
    });

    // Only update localStorage and set current content on client-side
    if (typeof window !== 'undefined' && noteId && content) {
      // Save to local storage
      localStorage.setItem(`editorContent-${noteId}`, content);
      
      // Set current content for debouncing
      const sanitizedContent = sanitizeContent(content);
      if (sanitizedContent) {
        setCurrentContent(sanitizedContent);
      }
    }
  }, [noteId, sanitizeContent]);

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
    onUpdate: onEditorUpdate,
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

  // Debug logging function with type-safe parameters
  const debugLog = (message: string, ...args: Array<string | number | object | boolean | null | undefined>): void => {
    console.log(`[EditorContent Debug] ${message}`, ...args);
  };

  // Utility function to extract content from various possible formats
  const extractContent = (block: Block): string | null => {
    // Direct content string
    if (typeof block.content === 'string') {
      return block.content;
    }

    // Nested content object
    if (typeof block.content === 'object' && block.content !== null) {
      if (typeof block.content.content === 'string') {
        return block.content.content;
      }
    }

    return null;
  };

  // Effect to fetch and set content
  useEffect(() => {
    const fetchAndSetContent = async () => {
      debugLog('Starting fetchAndSetContent', { noteId, editorExists: !!editor });

      if (!noteId) {
        debugLog('No noteId provided');
        return;
      }

      try {
        debugLog(`Fetching block content for noteId: ${noteId}`);
        
        const response = await fetch(`/api/blocks?noteId=${noteId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        debugLog('Fetch response status', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          debugLog('Fetch error', { 
            status: response.status, 
            statusText: response.statusText, 
            errorText 
          });
          return;
        }

        const data: Block[] = await response.json();
        debugLog('Fetched block data', data);

        // Find the most recent block with content
        let mostRecentContent: string | null = null;
        let mostRecentTimestamp = 0;

        // Iterate through blocks to find the most recent content
        data.forEach((block) => {
          const content = extractContent(block);
          const timestamp = block.metadata?.lastEditedAt 
            ? new Date(block.metadata.lastEditedAt).getTime()
            : block.updatedAt
            ? new Date(block.updatedAt).getTime()
            : 0;

          if (content && timestamp > mostRecentTimestamp) {
            mostRecentContent = content;
            mostRecentTimestamp = timestamp;
          }
        });

        // Forcibly set content multiple ways
        if (mostRecentContent) {
          debugLog('Most recent content found', mostRecentContent);

          // Multiple attempts to set content
          if (editor) {
            debugLog('Attempting to set editor content');
            editor.commands.setContent(mostRecentContent);
          }
        } else {
          debugLog('No content found in any blocks');
        }
      } catch (error) {
        debugLog('Comprehensive error', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : 'No stack trace'
        });
      }
    };

    // Attempt to set content immediately and with a slight delay
    fetchAndSetContent();
    const timer = setTimeout(fetchAndSetContent, 500);

    // Cleanup
    return () => clearTimeout(timer);
  }, [noteId, editor]);

  // Track initial content for setting after editor initialization
  const [initialContent, setInitialContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlockContent = async () => {
      if (!noteId) {
        console.warn('No noteId provided for fetching block content');
        return;
      }

      try {
        console.log(`Fetching block content for noteId: ${noteId}`);
        
        const response = await fetch(`/api/blocks?noteId=${noteId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Fetch response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fetch block content error:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }

        const data: Block[] = await response.json();
        console.log('Fetched block data:', JSON.stringify(data, null, 2));
        
        // Store content for later setting
        if (data.length > 0) {
          // Safely extract content as a string
          const contentToSet = extractContent(data[0]);
          
          console.log('Content found, storing for later setting');
          
          // Only set if content is a non-null string
          if (contentToSet) {
            setInitialContent(contentToSet);
          }
        }
      } catch (error) {
        console.error('Comprehensive error fetching block content:', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : 'No stack trace',
          noteId
        });
      }
    };

    fetchBlockContent();
  }, [noteId]);

  // Separate effect to set content when editor or initial content changes
  useEffect(() => {
    if (editor && initialContent) {
      console.log('Setting editor content:', initialContent);
      
      // Use a slight timeout to ensure editor is fully ready
      const timer = setTimeout(() => {
        editor.commands.setContent(initialContent);
        console.log('Editor content set successfully');
      }, 100);

      // Cleanup timeout
      return () => clearTimeout(timer);
    }
  }, [editor, initialContent]);

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

  const handleTitleBlur = async () => {
    setIsEditing(false);
    
    // Only update if title has changed
    if (title !== previousTitle && noteId) {
      try {
        const response = await fetch(`/api/notes?noteId=${noteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        });

        if (response.ok) {
          setPreviousTitle(title);
        } else {
          console.error('Failed to update title');
        }
      } catch (error) {
        console.error('Error updating title:', error);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      
      // Only update if title has changed
      if (title !== previousTitle && noteId) {
        try {
          const response = await fetch(`/api/notes?noteId=${noteId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
          });

          if (response.ok) {
            setPreviousTitle(title);
          } else {
            console.error('Failed to update title');
          }
        } catch (error) {
          console.error('Error updating title:', error);
        }
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

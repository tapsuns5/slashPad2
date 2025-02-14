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

interface EditorContentProps {
  className?: string;
  editorRef: React.RefObject<Editor | null>;
  extensions?: Extension[];
  content?: string;
}

const EditorContent: React.FC<EditorContentProps> = ({
  editorRef,
  className,
  extensions,
  content
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

  const editor = useEditor({
    extensions: extensions || editorExtensions,
    content: content || "<p></p>", // Use provided content or default
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      
      // Only update localStorage on client-side
      if (typeof window !== 'undefined') {
        localStorage.setItem("editorContent", content);
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
      // Directly assign the editor to the ref
      if (editorRef) {
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
          editor={editorRef.current as Editor}
          filterValue={commandInput}
        />
      )}
    </div>
  );
};

export default EditorContent;

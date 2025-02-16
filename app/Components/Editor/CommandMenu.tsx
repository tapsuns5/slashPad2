import React, { useRef, useEffect, useState } from "react";
import { CommandList, Command } from "./CommandList";
import { Heading1, Heading2, Heading3, List, ListOrdered, TextQuote, Code, ImageIcon, Pilcrow, ListTodo, Table, ListCollapse } from "lucide-react";
import { Editor } from "@tiptap/react";

export const COMMANDS: Command[] = [
  { id: "text-group", label: "Text", type: "group" },
  { id: "heading1", label: "H1 Heading 1", icon: <Heading1 strokeWidth={1} />, shortcut: "h1 " },
  { id: "heading2", label: "H2 Heading 2", icon: <Heading2 strokeWidth={1} />, shortcut: "h2 " },
  { id: "heading3", label: "H3 Heading 3", icon: <Heading3 strokeWidth={1} />, shortcut: "h3 " },
  { id: "paragraph", label: "Paragraph", icon: <Pilcrow strokeWidth={1} />, shortcut: "p" },

  { id: "blocks-group", label: "Blocks", type: "group" },
  { id: "bullet", label: "Bullet List", icon: <List strokeWidth={1} />, shortcut: "* " },
  {
    id: "ordered",
    label: "Numbered List",
    icon: <ListOrdered strokeWidth={1} />,
    shortcut: "1. ",
  },
  {
    id: "blockquote",
    label: "Blockquote",
    icon: <TextQuote strokeWidth={1} />,
    shortcut: "> ",
  },
  { id: "code", label: "Code", icon: <Code strokeWidth={1} />, shortcut: "```" },
  { id: "tiptapimage", label: "Image", icon: <ImageIcon strokeWidth={1} />, shortcut: "![]" },
  { id: "task", label: "Task", icon: <ListTodo strokeWidth={1} />, shortcut: "- " },
  { id: "table", label: "Table", icon: <Table strokeWidth={1} />, shortcut: "||" },
  { id: "details", label: "Details", icon: <ListCollapse strokeWidth={1} />, shortcut: ">" },
  
];

interface CommandMenuProps {
  isVisible: boolean;
  onSelectCommand: (commandId: string) => void;
  onClose: () => void;
  editor: Editor;
  filterValue?: string;
}

export const executeCommand = (command: Command, editor: Editor) => {
  console.log("Executing command:", command);
  
  // Comprehensive null and method checks
  if (!editor) {
    console.error("Editor not initialized");
    return;
  }

  // Verify critical methods exist
  if (!editor.chain || typeof editor.chain !== 'function') {
    console.error("Editor chain method is not available");
    return;
  }

  try {
    const chain = editor.chain().focus();

    switch (command.id) {
      case "bullet":
        chain.focus().toggleBulletList().run();
        break;
      case "heading1":
        chain.toggleHeading({ level: 1 }).run();
        break;
      case "heading2":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "heading3":
        chain.toggleHeading({ level: 3 }).run();
        break;
      case "code":
        chain.toggleCodeBlock().run();
        break;
      case "task":
        chain.toggleTaskList().run();
        break;
      case "ordered":
        chain.toggleOrderedList().run();
        break;
      case "blockquote":
        chain.toggleBlockquote().run();
        break;
      case "table":
        chain.insertTable({ rows: 3, cols: 3 }).run();
        break;
      case "details":
        chain
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .setDetails()
          .run();
        break;
      default:
        console.log("Unknown command:", command.id);
    }
  } catch (error) {
    console.error("Error executing command:", error);
  }
};

const CommandMenu: React.FC<CommandMenuProps> = ({ 
  isVisible, 
  onSelectCommand,
  onClose,
  editor,
  filterValue = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && editor) {
      const { state, view } = editor;
      const { from } = state.selection;
      const coords = view.coordsAtPos(from);
      // const domRect = view.dom.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 0;

      // Calculate space below cursor
      const spaceBelow = window.innerHeight - coords.bottom;

      // Position menu above if not enough space below
      const top = spaceBelow < menuHeight + 10
        ? coords.top - menuHeight - 10 // 10px padding
        : coords.bottom + 10;

      setPosition({
        top: top,
        left: coords.left
      });
    }
  }, [isVisible, editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const filteredCommands = COMMANDS.filter((command) =>
    command.label.toLowerCase().includes(filterValue.toLowerCase()) ||
    (command.shortcut && command.shortcut.toLowerCase().includes(filterValue.toLowerCase()))
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-[12rem] bg-white shadow-md border rounded-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="max-h-[300px] overflow-y-auto p-2">
        <CommandList
          isOpen={true}
          commands={filteredCommands}
          onSelect={(command: Command) => {
            executeCommand(command, editor);
            onSelectCommand(command.id);
          }}
        />
      </div>
    </div>
  );
};

export default CommandMenu;

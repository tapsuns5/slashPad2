import React, { useRef, useEffect, useState } from "react";
import { CommandList, Command } from "./CommandList";
import { Heading1, Heading2, Heading3, List, ListOrdered, TextQuote, Code, ImageIcon, Pilcrow, ListTodo, Table, ListCollapse, Minus } from "lucide-react";
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
  { id: "div", label: "Divider", icon: <Minus strokeWidth={1} />, shortcut: "---" }
  
  
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
  
  if (!editor) {
    console.error("Editor not initialized");
    return;
  }

  if (!editor.chain || typeof editor.chain !== 'function') {
    console.error("Editor chain method is not available");
    return;
  }

  try {
    // Get the current selection
    const { from } = editor.state.selection;
    const chain = editor.chain();
    
    // Delete the slash command text
    const text = editor.view.state.doc.textBetween(Math.max(0, from - 10), from);
    const slashCommand = text.match(/\/\w*$/)?.[0];
    
    if (slashCommand) {
      chain.deleteRange({
        from: from - slashCommand.length,
        to: from
      });
    }

    switch (command.id) {
      case "bullet":
        chain.liftListItem('listItem')
          .wrapInList('bulletList')
          .run();
        break;
      case "heading1":
        chain.setNode('heading', { level: 1 })
          .createParagraphNear()
          .run();
        break;
      case "heading2":
        chain.setNode('heading', { level: 2 })
          .createParagraphNear()
          .run();
        break;
      case "heading3":
        chain.setNode('heading', { level: 3 })
          .createParagraphNear()
          .run();
        break;
      case "code":
        chain.setNode('codeBlock').run();
        break;
      case "task":
        chain.wrapInList('taskList').run();
        break;
      case "ordered":
        chain.liftListItem('listItem')
          .wrapInList('orderedList')
          .run();
        break;
      case "blockquote":
        chain.setBlockquote().updateAttributes('blockquote', { class: 'blockquote' }).run();
        break;
      case "table":
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case "details":
        chain.setDetails().run();
        break;
      case "paragraph":
        chain.setParagraph().run();
        break;
      case "div":
        chain.focus().setHorizontalRule().run()
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

  const filteredCommands = COMMANDS.reduce((acc, command) => {
    if (command.type === 'group') {
      // Don't add group headers immediately - they'll be added only if needed
      return acc;
    }

    // Check if command matches filter
    const matchesFilter = 
      command.label.toLowerCase().includes(filterValue.toLowerCase()) ||
      (command.shortcut && command.shortcut.toLowerCase().includes(filterValue.toLowerCase()));
    
    if (matchesFilter) {
      // Find and add the associated group header if not already added
      const previousGroup = COMMANDS.slice(0, COMMANDS.indexOf(command))
        .reverse()
        .find(cmd => cmd.type === 'group');
      
      if (previousGroup && !acc.some(cmd => cmd.id === previousGroup.id)) {
        acc.push(previousGroup);
      }
      acc.push(command);
    }
    
    return acc;
  }, [] as Command[]);

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

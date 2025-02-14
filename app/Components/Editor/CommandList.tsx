"use client";

import type React from "react";

export type Command = {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action?: () => void;
};

export interface CommandListProps {
  isOpen: boolean;
  onSelect: (command: Command) => void;
  commands: Command[];
}

export const CommandList: React.FC<CommandListProps> = ({
  isOpen,
  onSelect,
  commands,
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="py-0.5">
      {commands.map((command, index) => (
        <div
          key={index}
          className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
          onClick={() => {
            console.log("Command clicked:", command);
            onSelect(command);
          }}
        >
          <span className="mr-1.5 text-base">{command.icon}</span>
          <div>
            <div className="font-medium leading-tight">{command.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommandList;
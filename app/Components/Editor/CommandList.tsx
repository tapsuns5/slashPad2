"use client";

import type React from "react";

export type Command = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  type?: 'command' | 'group';
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
      {commands.map((command, index) => {
        if (command.type === 'group') {
          return (
            <div 
              key={`group-${index}`} 
              className="px-2 py-1 text-xs font-semibold text-gray-600 tracking-wider mt-2"
            >
              {command.label}
            </div>
          );
        }
        
        return (
          <div
            key={command.id}
            className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
            onClick={() => {
              console.log("Command clicked:", command);
              onSelect(command);
            }}
          >
            {command.icon && <span className="mr-1.5 text-base">{command.icon}</span>}
            <div>
              <div className="font-medium leading-tight">{command.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommandList;
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";
import { Editor, BubbleMenu as TipTapBubbleMenu } from "@tiptap/react";
import styles from "../../../app/Styles/BubbleMenu.module.css";

interface BubbleMenuProps {
  editor: Editor;
}

const BubbleMenuComponent: React.FC<BubbleMenuProps> = ({ editor }) => {
  return (
    <TipTapBubbleMenu
      editor={editor}
      className={`relative z-10 ${styles.bubbleMenu}`}
    >
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`font-bold ${styles.iconButton}`}
      >
        B
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`italic ${styles.iconButton}`}
      >
        I
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`underline ${styles.iconButton}`}
      >
        U
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`line-through ${styles.iconButton}`}
      >
        S
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={styles.iconButton}
      >
        &lt;/&gt;
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className={`flex items-center rounded ml-2 mr-2 ${styles.iconButton}`}>
            <div className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded">
              <span className="border border-gray-200 rounded px-2" style={{ color: editor.getAttributes("textStyle").color || "#000000" }}>A</span>
              <span className="text-gray-600 text-xs">▼</span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2 bg-white rounded-lg shadow-lg z-50" align="start" side="bottom">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-xs text-gray-500 mb-1">Recently used</h3>
              <div className="grid grid-cols-4 gap-0.5">
                {["#000000", "#FF0000", "#4B9EFF", "#FFE600"].map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border border-gray-200 hover:border-blue-400 flex items-center justify-center transition-all text-xs"
                  >
                    <span style={{ color }}>A</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs text-gray-500 mb-1">Text color</h3>
              <div className="grid grid-cols-5 gap-0.5">
                {[
                  "#000000", "#434343", "#666666", "#999999", "#CCCCCC",
                  "#FF0000", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
                  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
                  "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800"
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border border-gray-200 hover:border-blue-400 flex items-center justify-center transition-all text-xs"
                  >
                    <span style={{ color }}>A</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs text-gray-500 mb-1">Background color</h3>
              <div className="grid grid-cols-5 gap-0.5">
                {[
                  "#FFFFFF", "#F5F5F5", "#FFF3F3", "#FFF8E6", "#FFFAE6",
                  "#F0FFF4", "#E3FAFC", "#E7F5FF", "#F3F0FF", "#FFF0F6",
                  "#FFE5E5", "#FFF9DB", "#F4FCE3", "#E3FEFF", "#EFF8FF",
                  "#F3E8FF", "#FCE7F3", "#FFE4E6", "#FEF3C7", "#ECFCCB"
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().setBackColor(color).run()}
                    className="w-6 h-6 rounded hover:border-blue-400 transition-all"
                    style={{ 
                      backgroundColor: color,
                      border: color === '#FFFFFF' ? '1px solid #e2e8f0' : '1px solid transparent'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t pt-1.5">
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  editor.chain().focus().unsetBackColor().run();
                }}
                className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
              >
                Reset to default
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TipTapBubbleMenu>
  );
};

export default BubbleMenuComponent;

"use client"

import * as React from "react"
import * as TiptapReact from "@tiptap/react";
import dynamic from "next/dynamic";
import { useEditor } from "@tiptap/react";
import editorExtensions from "../Components/Editor/EditorExtensions";
import { PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "../Components/Sidebar/SidebarMenu"
import { SidebarProvider, useSidebar } from "../Components/Sidebar/SidebarContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Dynamically import EditorComponent with SSR disabled
const EditorComponent = dynamic(() => import("../Components/Editor/Editor"), { 
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

const PageContent = () => {
    const { isOpen, toggleSidebar } = useSidebar()
    const [isClient, setIsClient] = React.useState(false);
    const editorRef = React.useRef<TiptapReact.Editor | null>(null);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const editor = useEditor({
        extensions: editorExtensions,
        content: '', // Optional: provide initial content
    })

    const [isSearchOpen, setIsSearchOpen] = React.useState(false)

    React.useEffect(() => {
        if (isClient && editor) {
            // Initialize editor
            editor.chain().focus()
        }
    }, [isClient, editor])

    if (!isClient) {
        return null;
    }

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex h-screen">
          {/* Fixed Sidebar */}
          <div className="h-screen sticky top-0">
            {isOpen && <Sidebar onSearchClick={() => setIsSearchOpen(true)} />}
          </div>

          <div className="flex-1 flex flex-col overflow-auto">
            {/* Header Container */}
            <div className="h-10 sticky top-0 bg-background pt-10 z-30">
              <header className="flex items-center h-[calc(100%-3rem)] bg-background border-b border-border">
                {!isOpen && (
                  <div className="mb-8 ml-4 h-full flex items-center">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={toggleSidebar} variant="ghost">
                            <PanelRight
                              strokeWidth={2}
                              className="h-[1.1rem] w-[1.1rem] text-[#91918e] scale-110"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="TooltipContent">
                          <p>Open sidebar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </header>
            </div>

            {/* Main Content */}
            <div className="flex flex-1">
              {/* Editor */}
              <div
                className={`flex-1 p-4 flex flex-col relative cursor-text`}
                id="editor-container"
              >
                <ScrollArea className="flex-1 h-full mb-16 w-full">
                  <div className="h-full w-full min-h-full">
                  <EditorComponent 
                    editorRef={editorRef} 
                    isSidebarOpen={isOpen} 
                  />
                  </div>
                </ScrollArea>
              </div>

              {/* Search Overlay */}
              {isSearchOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg w-96">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Search</h2>
                      <Button
                        onClick={() => setIsSearchOpen(false)}
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Close
                      </Button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
}

export default function Page() {
    return (
        <SidebarProvider>
            <PageContent />
        </SidebarProvider>
    )
}
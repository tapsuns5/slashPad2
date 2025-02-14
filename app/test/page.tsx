"use client"

import * as React from "react"
import { PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "../Components/Sidebar/SidebarMenu"
import { SidebarProvider, useSidebar } from "../Components/Sidebar/SidebarContext"


const PageContent = () => {
    // Initialize date as null
    const { isOpen, toggleSidebar } = useSidebar()
    const editorRef = React.useRef<HTMLDivElement | null>(null)
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)

    React.useEffect(() => {
        if (editorRef.current) {
            // Initialize editor
            editorRef.current.focus()
        }
    }, [])


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
                    <button onClick={toggleSidebar}>
                      <PanelRight
                        strokeWidth={1.5}
                        className="h-[1.1rem] w-[1.1rem] text-[#000000]"
                      />
                    </button>
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
                  {/*  <Editor editorRef={editorRef} isSidebarOpen={isOpen} /> */ }
                  </div>
                </ScrollArea>
                <div className="absolute bottom-4 right-4">
                  <Button
                    variant="outline"
                    className="border-border"
                    id="save-button"
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Search Overlay */}
              {isSearchOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg w-96">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Search</h2>
                      <button 
                        onClick={() => setIsSearchOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Close
                      </button>
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
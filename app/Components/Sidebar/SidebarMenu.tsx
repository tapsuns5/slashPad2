"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Home, PanelLeft, Search, StickyNote, CirclePlus, SquareCheck } from "lucide-react"
import { SidebarCalendar } from "./SidebarCalendar"
import { SidebarNotes } from "./SidebarNotes"
import { useSidebar } from "./SidebarContext"
import { createNewNote } from '@/app/utils/createNote'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from 'next/image';

const navItems = [
    {
        title: "Home",
        icon: Home,
        url: "#",
    },
    {
        title: "Search",
        icon: Search,
        url: "#",
    },
    {
        title: "Notes",
        icon: StickyNote,
        url: "#",
        chevronRight: ChevronRight,
        chevronLeft: ChevronLeft,
    },
    {
        title: "Calendar",
        icon: CalendarIcon,
        url: "#",
        chevronRight: ChevronRight,
        chevronLeft: ChevronLeft,
    },
    {
        title: "Tasks",
        icon: SquareCheck,
        url: "#",
    },
]

export const Sidebar = ({ 
    onSearchClick 
}: { 
    onSearchClick: () => void 
}) => {
    const router = useRouter()
    const { isOpen, toggleSidebar } = useSidebar()
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
    const [isNotesOpen, setIsNotesOpen] = React.useState(false)
    const [shouldResetCalendar, setShouldResetCalendar] = React.useState(false)

    const toggleCalendar = () => {
        if (isCalendarOpen) {
            setShouldResetCalendar(true)
        }
        setIsCalendarOpen(!isCalendarOpen)
        // Close notes if open
        if (isNotesOpen) setIsNotesOpen(false)
    }

    const toggleNotes = () => {
        setIsNotesOpen(!isNotesOpen)
        // Close calendar if open
        if (isCalendarOpen) {
            setIsCalendarOpen(false)
            setShouldResetCalendar(true)
        }
    }

    // Reset the reset flag after a short delay to ensure reset occurs
    React.useEffect(() => {
        if (shouldResetCalendar) {
            const timer = setTimeout(() => {
                setShouldResetCalendar(false)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [shouldResetCalendar])

    const handleCreateNote = async () => {
      try {
        const newNote = await createNewNote();
        router.push(`/notes/${newNote.slug}`); // Redirect to the new note
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    };

    return (
      <div className="flex h-screen">
        <aside
          className={`flex h-full w-60 flex-col border-r bg-[#f8f8f7] transition-all duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-10 border-b bg-[#f8f8f7]">
            <div className="flex items-center justify-between p-2">
              <Image 
                src="/slashPad.svg" 
                alt="SlashPad Logo" 
                width={100} 
                height={40} 
                className="object-contain"
              />
              <div className="flex items-center gap-1">
                <button onClick={toggleSidebar} className="p-2 ml-2">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                  <PanelLeft
                    strokeWidth={2}
                    className="h-[1.1rem] w-[1.1rem] text-[#91918e]"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="TooltipContent">
                        <p>Close menu</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </button>
                <button onClick={handleCreateNote} className="p-1">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CirclePlus
                          strokeWidth={2}
                          className="h-[1.1rem] w-[1.1rem] text-[#91918e]"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="TooltipContent">
                        <p>Create new pad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </button>
              </div>
            </div>
            
            <nav className="space-y-0.5 p-2">
                {navItems.map((item) => (
                    <a
                        key={item.title}
                        href={item.url}
                        className="flex items-center justify-between space-x-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-[#5f5e5b]"
                        onClick={(e) => {
                            e.preventDefault();
                            if (item.title === "Search") onSearchClick();
                            else if (item.title === "Calendar") toggleCalendar();
                            else if (item.title === "Notes") toggleNotes();
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            <item.icon strokeWidth={2.2} className="h-6 w-4 text-[#91918e]" />
                            <span>{item.title}</span>
                        </div>
                        {(item.title === "Calendar" || item.title === "Notes") && (
                            item.title === "Calendar" ? (
                                isCalendarOpen ? (
                                    <ChevronLeft strokeWidth={2.2} className="h-6 w-4 text-[#91918e]" />
                                ) : (
                                    <ChevronRight strokeWidth={2.2} className="h-6 w-4 text-[#91918e]" />
                                )
                            ) : item.title === "Notes" && (
                                isNotesOpen ? (
                                    <ChevronLeft strokeWidth={2.2} className="h-6 w-4 text-[#91918e]" />
                                ) : (
                                    <ChevronRight strokeWidth={2.2} className="h-6 w-4 text-[#91918e]" />
                                )
                            )
                        )}
                    </a>
                ))}
            </nav>
          </div>
        </aside>
        <div
          className={`transition-all duration-300 ease-in-out ${isNotesOpen ? "w-80" : "w-0"
            } overflow-hidden`}
        >
          <div className="h-full w-80 border-r bg-background">
            <SidebarNotes />
          </div>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out ${
            isCalendarOpen ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="h-full w-80 border-r bg-background">
            {shouldResetCalendar ? (
              <SidebarCalendar key={Math.random()} />
            ) : (
              <SidebarCalendar />
            )}
          </div>
        </div>
      </div>
    );
}

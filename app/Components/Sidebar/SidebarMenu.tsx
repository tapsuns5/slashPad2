"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Home, PanelLeft, Search, StickyNote, CirclePlus } from "lucide-react"
import { SidebarCalendar } from "./SidebarCalendar"
import { useSidebar } from "./SidebarContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNewNote } from '@/app/utils/createNote'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    },
    {
        title: "Calendar",
        icon: CalendarIcon,
        url: "#",
        chevronRight: ChevronRight,
        chevronLeft: ChevronLeft,
    },
]

const workspaces = [
    { value: "personal", label: "Personal" },
    { value: "work", label: "Work" },
    { value: "project", label: "Project" },
]

export const Sidebar = ({ 
    onSearchClick 
}: { 
    onSearchClick: () => void 
}) => {
    const router = useRouter()
    const { isOpen, toggleSidebar } = useSidebar()
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
    const [shouldResetCalendar, setShouldResetCalendar] = React.useState(false)

    const toggleCalendar = () => {
        if (isCalendarOpen) {
            // When closing the calendar, set reset flag to true
            setShouldResetCalendar(true)
        }
        setIsCalendarOpen(!isCalendarOpen)
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
              <Select>
                <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0 hover:bg-transparent">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.value} value={workspace.value}>
                      {workspace.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  className="flex items-center space-x-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-[#5f5e5b]"
                  onClick={
                    item.title === "Search"
                      ? onSearchClick
                      : item.title === "Calendar"
                      ? toggleCalendar
                      : undefined
                  }
                >
                  <item.icon
                    strokeWidth={2.2}
                    className="h-6 w-4 text-[#91918e]"
                  />
                  <span>{item.title}</span>
                  {item.title === "Calendar" &&
                    (isCalendarOpen ? (
                      <ChevronLeft
                        strokeWidth={2.2}
                        className="h-6 w-4 text-[#91918e]"
                      />
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ChevronRight
                              strokeWidth={2.2}
                              className="h-6 w-4 text-[#91918e]"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open menu</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                </a>
              ))}
            </nav>
          </div>
        </aside>
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

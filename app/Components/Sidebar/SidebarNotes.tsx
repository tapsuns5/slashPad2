"use client"

import * as React from "react"
import { Search, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Update the Note interface to include category
interface Note {
    id: number
    title: string
    content: string
    createdAt: string
    updatedAt: string
    category?: string  // Make category optional since some notes might not have it
    slug: string
}

const SidebarNotes = () => {
    const router = useRouter()
    const [notes, setNotes] = React.useState<Note[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [sortBy, setSortBy] = React.useState("newest")
    const [filter, setFilter] = React.useState("all")

    // Fetch notes
    React.useEffect(() => {
        const fetchNotes = async () => {
            try {
                // Get the current user ID (you'll need to implement this based on your auth system)
                const userId = 'cm7bbipbl0001cb5so38cbeid'; // Temporary hardcoded ID for testing
                const response = await fetch(`/api/notes?userId=${userId}`);
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to fetch notes');
                }
                
                const data = await response.json();
                setNotes(data);
            } catch (error) {
                console.error('Failed to fetch notes:', error);
            }
        };

        fetchNotes();
    }, []);

    // Filter and sort notes
    // Update the filtering logic
    const filteredAndSortedNotes = React.useMemo(() => {
        let filtered = [...notes]
    
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
    
        // Apply category filter
        if (filter !== 'all') {
            filtered = filtered.filter(note => note.category && note.category === filter)
        }
    
        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case 'title':
                    return a.title.localeCompare(b.title)
                default:
                    return 0
            }
        })

        return filtered
    }, [notes, searchQuery, sortBy, filter])

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="sticky top-0 z-10 bg-background p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 mt-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Notes</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <div className="grid gap-2">
                    {filteredAndSortedNotes.map((note) => (
                        <button
                            key={note.id}
                            onClick={() => router.push(`/notes/${note.slug}`)}
                            className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                            <h3 className="font-medium line-clamp-1">{note.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {note.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export { SidebarNotes }
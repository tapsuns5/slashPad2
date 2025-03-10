"use client"

import * as React from "react"
import { Calendar, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Update the Note interface to include category
interface Note {
    id: number
    title: string
    content: string
    createdAt: string
    updatedAt: string
    category?: string
    slug: string
    meeting?: {
        title: string
        id: string
    }
    tags?: string[] // Add this line to support multiple tags
}

const SidebarNotes = () => {
    const router = useRouter()
    const [notes, setNotes] = React.useState<Note[]>([])
    const [noteContents, setNoteContents] = React.useState<Record<number, string>>({})
    const [searchQuery, setSearchQuery] = React.useState("")
    const [sortBy, setSortBy] = React.useState("newest")
    const [selectedTag, setSelectedTag] = React.useState("all")
    const [availableTags, setAvailableTags] = React.useState<string[]>([])

    // Utility functions
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
    }

    const getContentPreview = (content: string) => {
        // First remove HTML tags, then remove Markdown syntax
        const withoutHtml = content.replace(/<[^>]*>/g, '')
        const cleanContent = withoutHtml.replace(/[#*`_~>]/g, "").trim()
        return cleanContent.length > 40 ? cleanContent.substring(0, 40) + "..." : cleanContent
    }

    // Fetch note contents
    const fetchNoteContent = React.useCallback(async (noteId: number) => {
        try {
            const response = await fetch(`/api/blocks?noteId=${noteId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch note content');
            }
            
            const blocks = await response.json();
            if (blocks && blocks.length > 0) {
                // Access content directly since it's already an object
                const content = blocks[0].content?.content || '';
                setNoteContents(prev => ({ ...prev, [noteId]: content }));
            }
        } catch (error) {
            console.error('Failed to fetch note content:', error);
            setNoteContents(prev => ({ ...prev, [noteId]: '' }));
        }
    }, []);

    // Fetch notes and extract tags
    React.useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await fetch('/api/notes');
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to fetch notes');
                }
                
                const data = await response.json();
                setNotes(data);

                // Extract unique tags
                const uniqueTags = new Set<string>();
                data.forEach((note: Note) => {
                    note.tags?.forEach(tag => uniqueTags.add(tag));
                });
                setAvailableTags(Array.from(uniqueTags).sort());
            } catch (error) {
                console.error('Failed to fetch notes:', error);
            }
        };

        fetchNotes();
    }, []);

    // Filter and sort notes
    const filteredAndSortedNotes = React.useMemo(() => {
        let filtered = [...notes]
    
        if (searchQuery) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (noteContents[note.id] || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
    
        if (selectedTag !== 'all') {
            filtered = filtered.filter(note => 
                note.tags?.includes(selectedTag)
            )
        }
    
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
    }, [notes, searchQuery, sortBy, selectedTag, noteContents])

    // Fetch contents for visible notes
    React.useEffect(() => {
        const unfetchedNotes = filteredAndSortedNotes.filter(
            note => !Object.hasOwn(noteContents, note.id)
        );
        
        unfetchedNotes.forEach(note => {
            fetchNoteContent(note.id);
        });
    }, [filteredAndSortedNotes, fetchNoteContent, noteContents]);

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="sticky top-0 z-10 bg-background p-2 border-b ">
                <div className="relative">
                    <Search className="absolute left-2 top-2 h-5 w-3 text-muted-foreground " />
                    <Input
                        placeholder="Search notes..."
                        className="pl-7 h-9 text-s border-[#e2e7ee] rounded-none [&::placeholder]:opacity-40"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 mt-1">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-7 text-xs px-2 border-[#e2e7ee] rounded-none">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                        <SelectTrigger className="h-7 text-xs px-2 border-[#e2e7ee] rounded-none">
                            <SelectValue placeholder="Filter by tag" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All tags</SelectItem>
                            {availableTags.map(tag => (
                                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="mt-2">
                <div className="px-2 flex flex-col gap-1">
                    {filteredAndSortedNotes.length > 0 ? (
                        filteredAndSortedNotes.map((note) => (
                            <button
                                key={note.id}
                                onClick={() => router.push(`/notes/${note.slug}`)}
                                className="w-full text-left p-2 rounded-none border bg-card hover:bg-accent transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(note.createdAt)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                    {noteContents[note.id] ? 
                                        getContentPreview(noteContents[note.id]) : 
                                        "Loading..."}
                                </p>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No notes found</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export { SidebarNotes }
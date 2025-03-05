import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventId: string, summary: string) => void;
}

export function CalendarModal({ isOpen, onClose, onSubmit }: CalendarModalProps) {
  const [eventId, setEventId] = useState("");
  const [summary, setSummary] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(eventId, summary);
    setEventId("");
    setSummary("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Link Calendar Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Event ID"
              required
            />
          </div>
          <div>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Event Summary"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Link Event</Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
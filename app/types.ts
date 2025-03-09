export type NodeAttributes = {
  uid?: string;  // Optional UID
  level?: number;  // For headings
  checked?: boolean;  // For task list items
  [key: string]: string | number | boolean | undefined;  // Allow other potential attributes
};

export type NodeDetail = {
  type: string;
  position: number;
  content: string;
  attributes: NodeAttributes & {
    hasUID: boolean;
  };
};

export type NodeWithAttributes = {
  type: string;
  position: number;
  attributes: NodeAttributes;
  hasUID: boolean;
  uidValue?: string;
};


// Define precise types for block and content
export type BlockMetadata = {
  contentType?: string;
  lastEditedAt?: string;
};

export type Block = {
  id?: string;
  content?: string | {
    content?: string;
    [key: string]: unknown;
  };
  metadata?: BlockMetadata;
  updatedAt?: string;
  noteId?: string;
};

export interface Task {
  id: string
  title: string
  description?: string
  date: Date
  priority: string
  completed?: boolean
  repeat?: {
    type: "none" | "daily" | "weekly" | "monthly"
    dayOfWeek?: number // 0-6, Sunday to Saturday
    dayOfMonth?: number // 1-31
    weekOfMonth?: number // 1-5 (first, second, third, fourth, last)
    monthlyType?: "dayOfMonth" | "dayOfWeek" // Whether to repeat by day of month or day of week
  }
}


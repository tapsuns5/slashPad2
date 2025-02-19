'use client'

export async function createNewNote() {
  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create note');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating new note:', error);
    throw error;
  }
}
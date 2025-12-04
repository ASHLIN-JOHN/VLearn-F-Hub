"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Plus, Edit, Trash2, Save, X, Search } from "lucide-react";
import { useAuth } from "./auth-provider";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function NotesModule() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("user_id", "==", user.id),
      orderBy("created_at", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at:
            doc.data().created_at?.toDate?.()?.toISOString() ||
            doc.data().created_at,
          updated_at:
            doc.data().updated_at?.toDate?.()?.toISOString() ||
            doc.data().updated_at,
        })) as Note[];

        setNotes(notesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading notes:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const saveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim() || !user) return;

    try {
      await addDoc(collection(db, "notes"), {
        title: newNote.title,
        content: newNote.content,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        user_id: user.id,
      });

      setNewNote({ title: "", content: "" });
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const updateNote = async () => {
    if (
      !editingNote ||
      !editingNote.title.trim() ||
      !editingNote.content.trim()
    )
      return;

    try {
      await updateDoc(doc(db, "notes", editingNote.id), {
        title: editingNote.title,
        content: editingNote.content,
        updated_at: Timestamp.now(),
      });

      setEditingNote(null);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, "notes", noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <StickyNote className="h-8 w-8" />
              My Notes
            </h1>
            <p className="text-muted-foreground">
              Save and organize your learning notes
            </p>
          </div>
        </div>
        <div className="text-center py-12">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <StickyNote className="h-8 w-8" />
            My Notes
          </h1>
          <p className="text-muted-foreground">
            Save and organize your learning notes
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create New Note */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
            />
            <Textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) =>
                setNewNote({ ...newNote, content: e.target.value })
              }
              rows={6}
            />
            <div className="flex gap-2">
              <Button onClick={saveNote} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Note
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: "", content: "" });
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <StickyNote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first note to get started!"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {editingNote?.id === note.id ? (
                      <Input
                        value={editingNote.title}
                        onChange={(e) =>
                          setEditingNote({
                            ...editingNote,
                            title: e.target.value,
                          })
                        }
                        className="text-lg font-semibold"
                      />
                    ) : (
                      note.title
                    )}
                  </CardTitle>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    Created: {formatDate(note.created_at)}
                  </Badge>
                  {note.updated_at !== note.created_at && (
                    <Badge variant="outline">
                      Updated: {formatDate(note.updated_at)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingNote?.id === note.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editingNote.content}
                      onChange={(e) =>
                        setEditingNote({
                          ...editingNote,
                          content: e.target.value,
                        })
                      }
                      rows={6}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={updateNote}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingNote(null)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-6">
                    {note.content}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

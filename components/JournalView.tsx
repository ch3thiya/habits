'use client';

import { useState, useEffect, useRef } from 'react';
import { Journal } from '@/types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronLeft } from 'lucide-react';
import { addJournal, updateJournal, deleteJournal } from '@/app/actions/journals';

// TipTap imports
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

function RichTextEditor({ content, onUpdate }: { content: string, onUpdate: (val: string) => void }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => { setIsMounted(true); }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'underline text-emerald-400 hover:text-emerald-300',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-neutral prose-sm sm:prose-base focus:outline-none max-w-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!isMounted || !editor) {
    return <div className="min-h-[400px] animate-pulse bg-neutral-900/30 rounded-md" />;
  }

  return (
    <div className="w-full">
      {/* Mini toolbar */}
      <div className="flex gap-1 mb-4 p-1 bg-neutral-900/50 rounded flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("px-2 py-1 text-xs rounded hover:bg-neutral-800 transition-colors", editor.isActive('bold') ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400')}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("px-2 py-1 text-xs rounded hover:bg-neutral-800 transition-colors", editor.isActive('italic') ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400')}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("px-2 py-1 text-xs rounded hover:bg-neutral-800 transition-colors", editor.isActive('bulletList') ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400')}
        >
          Bullet List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("px-2 py-1 text-xs rounded hover:bg-neutral-800 transition-colors", editor.isActive('orderedList') ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400')}
        >
          Numbered List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default function JournalView({ initialJournals }: { initialJournals: Journal[] }) {
  const [journals, setJournals] = useState<Journal[]>(initialJournals);
  const [activeEntry, setActiveEntry] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [journalToDelete, setJournalToDelete] = useState<{ id: string, title?: string } | null>(null);

  useEffect(() => setJournals(initialJournals), [initialJournals]);

  const handleCreate = async () => {
    const created = await addJournal('Untitled Entry', '');
    if (created) {
      setJournals(prev => [created, ...prev]);
      setActiveEntry(created.id);
      setEditTitle(created.title);
      setEditContent(created.content || '');
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setJournalToDelete({ id, title });
  };

  const confirmDeleteJournal = async () => {
    if (!journalToDelete) return;
    const { id } = journalToDelete;
    if (activeEntry === id) setActiveEntry(null);
    setJournals(prev => prev.filter(j => j.id !== id));
    await deleteJournal(id);
    setJournalToDelete(null);
  };

  const openEditor = (entry: Journal) => {
    setActiveEntry(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content || '');
  };

  const autoSave = (id: string, title: string, content: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setJournals(prev => prev.map(j => {
      if (j.id === id) return { ...j, title, content, updated_at: new Date().toISOString() };
      return j;
    }));

    saveTimeoutRef.current = setTimeout(async () => {
      await updateJournal(id, title, content);
    }, 1000);
  };

  // Plain text preview helper
  const stripHtml = (html: string | null) => {
    if (!html) return 'No content';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html.replace(/<\/(p|div|li|h[1-6])>/g, '</$1>\n').replace(/<br\s*[\/]?>/gi, '\n');
    return (tmp.textContent || tmp.innerText || "No content").trim();
  };

  return (
    <div className="animate-fade-in relative">
      <AnimatePresence mode="wait">
        {!activeEntry ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-300">Journal</h2>
              <button 
                onClick={handleCreate}
                className="text-neutral-300 hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1 self-start sm:self-auto border border-neutral-700 px-3 py-1.5 rounded-md"
              >
                <Plus size={14} /> New Entry
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {journals.length === 0 && (
                <div className="text-neutral-600 text-sm py-8 italic col-span-full">No journal entries yet. Write your first thought!</div>
              )}
              {journals.map(journal => (
                <div 
                  key={journal.id}
                  onClick={() => openEditor(journal)}
                  className="group flex flex-col justify-between p-5 border border-neutral-900/50 rounded-xl bg-neutral-950/30 hover:border-neutral-800 transition-all cursor-pointer h-40 relative overflow-hidden"
                >
                  <div>
                    <h3 className="font-medium text-neutral-200 truncate">{journal.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1 mb-3">{format(new Date(journal.updated_at), 'MMM d, yyyy h:mm a')}</p>
                    <p className="text-sm text-neutral-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {stripHtml(journal.content)}
                    </p>
                  </div>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDeleteRequest(e, journal.id, journal.title)} 
                      className="text-neutral-600 hover:text-red-900/80 transition-all p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveEntry(null)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-1"
              >
                <ChevronLeft size={20} />
              </button>
              <input 
                type="text" 
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  autoSave(activeEntry, e.target.value, editContent);
                }}
                placeholder="Entry Title..."
                className="bg-transparent text-2xl font-medium text-neutral-200 outline-none w-full placeholder:text-neutral-700"
              />
              <button 
                onClick={(e) => handleDeleteRequest(e, activeEntry, editTitle)}
                className="hidden"
                title="Delete Entry"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="pl-9 pb-12">
              <RichTextEditor 
                content={editContent} 
                onUpdate={(val) => {
                  setEditContent(val);
                  autoSave(activeEntry, editTitle, val);
                }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up modal for journal deletion */}
      <AnimatePresence>
        {journalToDelete && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setJournalToDelete(null)}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-red-900/30 p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-neutral-200 font-medium text-lg">Delete Journal?</h3>
                <p className="text-neutral-500 text-sm">
                  Are you sure you want to completely remove "{journalToDelete.title}"? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setJournalToDelete(null)}
                  className="flex-1 bg-neutral-800 text-neutral-300 font-medium py-2.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteJournal}
                  className="flex-1 bg-red-900/80 text-red-100 font-medium py-2.5 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

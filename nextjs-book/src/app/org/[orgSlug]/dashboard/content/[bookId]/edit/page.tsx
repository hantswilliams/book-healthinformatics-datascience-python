"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';

interface Book {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string;
  category: string;
  estimatedHours?: number | null;
  tags: string[];
}
interface Section { id: string; title?: string | null; type: string; order: number; }
interface Chapter { id: string; title: string; emoji: string; order: number; sections: Section[]; }

const difficultyOptions = ['BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'];
const categoryOptions = [
  'GENERAL','DATA_SCIENCE','WEB_DEVELOPMENT','MACHINE_LEARNING','HEALTHCARE','FINANCE','GEOSPATIAL','AUTOMATION','API_DEVELOPMENT'
];

export default function EditCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orgSlug = useOrgSlug();
  const bookId = params?.bookId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reorderSaving, setReorderSaving] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [success, setSuccess] = useState<string|undefined>();
  const [form, setForm] = useState<Partial<Book>>({});
  const [tagInput, setTagInput] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['OWNER','ADMIN'].includes(session.user.role)) {
      router.push(`/org/${orgSlug}/dashboard/content`);
      return;
    }
    fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, bookId]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/books/${bookId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load course');
      const b = data.book;
      setForm({
        id: b.id,
        title: b.title,
        description: b.description || '',
        difficulty: b.difficulty,
        category: b.category,
        estimatedHours: b.estimatedHours || undefined,
        tags: b.tags || []
      });
      setChapters(b.chapters || []);
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (k: keyof Book, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const addTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    updateField('tags', [ ...(form.tags || []), val ]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateField('tags', (form.tags || []).filter(t => t !== tag));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    if (!form.title) { setError('Title is required'); return; }
    try {
      setSaving(true);
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          difficulty: form.difficulty,
          category: form.category,
          estimatedHours: form.estimatedHours || null,
          tags: form.tags || []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update course');
      setSuccess('Course updated');
    } catch (e:any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const moveChapter = (index: number, direction: -1 | 1) => {
    setChapters(prev => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return arr;
      const tmp = arr[index];
      arr[index] = arr[newIndex];
      arr[newIndex] = tmp;
      return arr;
    });
  };

  const saveChapterOrder = async () => {
    try {
      setReorderSaving(true);
      const chapterIds = chapters.map(c => c.id);
      const res = await fetch(`/api/books/${bookId}/reorder-chapters`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save order');
      setSuccess('Chapter order updated');
  // Normalize local order numbers to reflect persisted state
  setChapters(prev => prev.map((c, idx) => ({ ...c, order: idx + 1 })));
  // Optionally refetch to stay canonical (comment out if unnecessary)
  fetchBook();
    } catch (e:any) {
      setError(e.message);
    } finally {
      setReorderSaving(false);
    }
  };

  const moveSection = (chapterId: string, index: number, direction: -1 | 1) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      const secs = [...ch.sections];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= secs.length) return ch;
      const tmp = secs[index];
      secs[index] = secs[newIndex];
      secs[newIndex] = tmp;
      return { ...ch, sections: secs };
    }));
  };

  const saveSectionOrder = async (chapterId: string) => {
    try {
      setReorderSaving(true);
      const chapter = chapters.find(c => c.id === chapterId);
      if (!chapter) return;
      const sectionIds = chapter.sections.map(s => s.id);
      const res = await fetch(`/api/chapters/${chapterId}/reorder-sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save section order');
      setSuccess('Section order updated');
      // Normalize local section order numbers
      setChapters(prev => prev.map(ch => ch.id === chapterId 
        ? { ...ch, sections: ch.sections.map((s, idx) => ({ ...s, order: idx + 1 })) }
        : ch
      ));
      fetchBook();
    } catch (e:any) {
      setError(e.message);
    } finally {
      setReorderSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading course...</div>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link href={`/org/${orgSlug}/dashboard/content`} className="text-blue-600 text-sm hover:underline">Back to Content</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <nav className="text-sm mb-2 text-gray-500 flex items-center space-x-2">
              <Link href={`/org/${orgSlug}/dashboard`} className="hover:text-zinc-700">Dashboard</Link>
              <span>/</span>
              <Link href={`/org/${orgSlug}/dashboard/content`} className="hover:text-zinc-700">Content</Link>
              <span>/</span>
              <span>Edit Course</span>
            </nav>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-sm text-gray-600 mt-1">Update basic metadata for this course.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href={`/org/${orgSlug}/dashboard/content/${bookId}/edit-enhanced`} className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700">
              🚀 Enhanced Editor
            </Link>
            <Link href={`/book/${(form as any).slug || ''}`} className="text-sm text-blue-600 hover:underline">View</Link>
            <Link href={`/org/${orgSlug}/dashboard/content`} className="inline-flex items-center px-3 py-2 rounded-md text-sm border border-gray-300 bg-white hover:bg-gray-50">Back</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 border border-gray-200">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
          {success && <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded">{success}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title || ''} onChange={e=>updateField('title', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description || ''} onChange={e=>updateField('description', e.target.value)} rows={4} className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={form.difficulty || ''} onChange={e=>updateField('difficulty', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm">
                <option value="">Select</option>
                {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category || ''} onChange={e=>updateField('category', e.target.value)} className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm">
                <option value="">Select</option>
                {categoryOptions.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input type="number" min={1} max={100} value={form.estimatedHours || ''} onChange={e=>updateField('estimatedHours', e.target.value ? Number(e.target.value) : undefined)} className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex items-center space-x-2 mb-2">
              <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(); } }} placeholder="Add a tag and press Enter" className="flex-1 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Add</button>
            </div>
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-300">
                    {tag}
                    <button type="button" onClick={()=>removeTag(tag)} className="ml-1 text-gray-500 hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Link href={`/org/${orgSlug}/dashboard/content`} className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={saving} className="inline-flex items-center px-6 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Enhanced Editor Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enhanced Editor Available
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                For advanced editing including full chapter and section management, Python execution modes, 
                and Monaco code editor, use our Enhanced Editor.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Full chapter/section editing
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Python execution modes
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  Monaco code editor
                </div>
              </div>
              <div className="mt-4">
                <Link 
                  href={`/org/${orgSlug}/dashboard/content/${bookId}/edit-enhanced`}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  🚀 Open Enhanced Editor
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chapters & Sections</h2>
            <button onClick={saveChapterOrder} disabled={reorderSaving} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{reorderSaving ? 'Saving...' : 'Save Chapter Order'}</button>
          </div>
          <p className="text-sm text-gray-600 mb-4">Reorder chapters and sections. Drag-and-drop coming soon.</p>
          <div className="space-y-6">
            {chapters.map((ch, cIdx) => (
              <div key={ch.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{ch.emoji}</span>
                    <h3 className="font-medium text-gray-900">{ch.title}</h3>
                    <span className="text-xs text-gray-500">{ch.sections.length} sections</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => moveChapter(cIdx, -1)} disabled={cIdx===0 || reorderSaving} className="px-2 py-1 text-xs border rounded disabled:opacity-40">Up</button>
                    <button onClick={() => moveChapter(cIdx, 1)} disabled={cIdx===chapters.length-1 || reorderSaving} className="px-2 py-1 text-xs border rounded disabled:opacity-40">Down</button>
                  </div>
                </div>
                {ch.sections.length > 0 && (
                  <div className="p-4 space-y-3">
                    {ch.sections.map((s, sIdx) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono text-gray-500 w-6">{sIdx+1}</span>
                          <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{s.title || (s.type === 'PYTHON' ? 'Python Code' : 'Untitled')}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.type === 'PYTHON' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{s.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button onClick={() => moveSection(ch.id, sIdx, -1)} disabled={sIdx===0 || reorderSaving} className="px-2 py-1 text-[10px] border rounded disabled:opacity-40">Up</button>
                          <button onClick={() => moveSection(ch.id, sIdx, 1)} disabled={sIdx===ch.sections.length-1 || reorderSaving} className="px-2 py-1 text-[10px] border rounded disabled:opacity-40">Down</button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button onClick={() => saveSectionOrder(ch.id)} disabled={reorderSaving} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{reorderSaving ? 'Saving...' : 'Save Section Order'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {chapters.length === 0 && (
              <div className="text-sm text-gray-500">No chapters found for this course.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

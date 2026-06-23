import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './supabase'
import BookGrid from './components/BookGrid'
import BookModal from './components/BookModal'
import FilterBar from './components/FilterBar'
import Toast from './components/Toast'
import ThemePicker from './components/ThemePicker'
import { useTheme } from './hooks/useTheme'

export default function App({ session }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(isConfigured)
  const [fetchError, setFetchError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBookcase, setFilterBookcase] = useState('all')
  const [toast, setToast] = useState(null)
  const { themeId, setThemeId } = useTheme()

  useEffect(() => {
    if (isConfigured) fetchBooks()
  }, [])

  async function fetchBooks() {
    setLoading(true)
    setFetchError('')
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title')
      if (error) throw error
      setBooks(data)
    } catch (err) {
      setFetchError(err.message || 'Failed to load books. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditingBook(null)
    setModalOpen(true)
  }

  function openEdit(book) {
    setEditingBook(book)
    setModalOpen(true)
  }

  async function deleteBook(id) {
    if (!confirm('Delete this book?')) return
    try {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
      setBooks(prev => prev.filter(b => b.id !== id))
      showToast('Book deleted.')
    } catch (err) {
      showToast(err.message || 'Failed to delete book. Please try again.', 'error')
    }
  }

  function onSaved(book, isNew) {
    if (isNew) {
      setBooks(prev => [...prev, book].sort((a, b) => a.title.localeCompare(b.title)))
    } else {
      setBooks(prev => prev.map(b => b.id === book.id ? book : b))
    }
    setModalOpen(false)
    showToast(isNew ? 'Book added!' : 'Book updated.')
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  const bookcases = [...new Set(books.map(b => b.bookcase).filter(Boolean))].sort()

  const filtered = books.filter(book => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q) ||
      book.genre?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || book.read_status === filterStatus
    const matchBookcase = filterBookcase === 'all' || book.bookcase === filterBookcase
    return matchSearch && matchStatus && matchBookcase
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--t-page)' }}>
      <header className="px-6 py-4 shadow-md flex items-center justify-between" style={{ background: 'var(--t-hdr)' }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--t-hdr-text)' }}>Ms. K's Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--t-hdr-sub)' }}>{books.length} book{books.length !== 1 ? 's' : ''} in collection</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            className="font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ background: 'var(--t-btn)', color: 'var(--t-btn-text)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--t-btn-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--t-btn)'}
          >
            + Add Book
          </button>
          <ThemePicker themeId={themeId} onThemeChange={setThemeId} />
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm cursor-pointer transition-colors"
            style={{ color: 'var(--t-hdr-sub)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t-hdr-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t-hdr-sub)'}
            title={`Signed in as ${session.user.email}`}
          >
            Sign Out
          </button>
        </div>
      </header>

      {!isConfigured && (
        <div className="px-6 py-3 text-sm border-b" style={{ background: 'var(--t-banner-bg)', borderColor: 'var(--t-banner-border)', color: 'var(--t-banner-text)' }}>
          <strong>Setup required:</strong> Add your Supabase URL and anon key to <code className="px-1 rounded" style={{ background: 'var(--t-btn2)' }}>.env.local</code>, then restart the dev server.
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <FilterBar
          search={search}
          onSearch={setSearch}
          filterStatus={filterStatus}
          onFilterStatus={setFilterStatus}
          filterBookcase={filterBookcase}
          onFilterBookcase={setFilterBookcase}
          bookcases={bookcases}
        />

        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--t-accent)' }}>Loading your collection...</div>
        ) : fetchError ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{fetchError}</p>
            <button
              onClick={fetchBooks}
              className="text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
              style={{ background: 'var(--t-btn)' }}
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--t-accent)' }}>
            {books.length === 0 ? 'No books yet — add your first one!' : 'No books match your filters.'}
          </div>
        ) : (
          <BookGrid books={filtered} onEdit={openEdit} onDelete={deleteBook} />
        )}
      </main>

      {modalOpen && (
        <BookModal
          book={editingBook}
          userId={session.user.id}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './supabase'

import BookGrid from './components/BookGrid'
import BookModal from './components/BookModal'
import FilterBar from './components/FilterBar'
import Toast from './components/Toast'

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
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-900 text-amber-50 px-6 py-4 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ms. K's Library</h1>
          <p className="text-amber-300 text-sm mt-0.5">{books.length} book{books.length !== 1 ? 's' : ''} in collection</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            + Add Book
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-amber-300 hover:text-amber-100 text-sm cursor-pointer"
            title={`Signed in as ${session.user.email}`}
          >
            Sign Out
          </button>
        </div>
      </header>

      {!isConfigured && (
        <div className="bg-amber-100 border-b border-amber-300 px-6 py-3 text-amber-800 text-sm">
          <strong>Setup required:</strong> Add your Supabase URL and anon key to <code className="bg-amber-200 px-1 rounded">.env.local</code>, then restart the dev server.
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
          <div className="text-center py-20 text-amber-700">Loading your collection...</div>
        ) : fetchError ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{fetchError}</p>
            <button
              onClick={fetchBooks}
              className="bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-amber-700">
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

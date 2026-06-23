import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './supabase'
import BookGrid from './components/BookGrid'
import BookModal from './components/BookModal'
import FilterBar from './components/FilterBar'

export default function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(isConfigured)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBookcase, setFilterBookcase] = useState('all')

  useEffect(() => {
    if (isConfigured) fetchBooks()
  }, [])

  async function fetchBooks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('title')
    if (!error) setBooks(data)
    setLoading(false)
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
    await supabase.from('books').delete().eq('id', id)
    setBooks(books.filter(b => b.id !== id))
  }

  function onSaved(book, isNew) {
    if (isNew) {
      setBooks(prev => [...prev, book].sort((a, b) => a.title.localeCompare(b.title)))
    } else {
      setBooks(prev => prev.map(b => b.id === book.id ? book : b))
    }
    setModalOpen(false)
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
        <button
          onClick={openAdd}
          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + Add Book
        </button>
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
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

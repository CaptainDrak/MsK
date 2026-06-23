import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import BarcodeScanner from './BarcodeScanner'
import ISBNScanner from './ISBNScanner'

const EMPTY_FORM = {
  title: '',
  author: '',
  genre: '',
  isbn: '',
  cover_url: '',
  read_status: 'unread',
  bookcase: '',
  location: '',
  notes: '',
}

async function fetchBookByISBN(isbn) {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn.trim()}.json`)
  if (!res.ok) throw new Error(`ISBN not found in Open Library (${res.status})`)
  const data = await res.json()

  const title = data.title || ''
  const coverId = data.covers?.[0]
  const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : ''

  let author = ''
  if (data.authors?.length) {
    const authorRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`)
    if (authorRes.ok) {
      const authorData = await authorRes.json()
      author = authorData.name || ''
    }
  }

  return { title, author, coverUrl }
}

export default function BookModal({ book, onClose, onSaved }) {
  const [form, setForm] = useState(book ? { ...EMPTY_FORM, ...book } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false) // 'barcode' | 'isbn' | false
  const [showScanMenu, setShowScanMenu] = useState(false)
  const scanMenuRef = useRef(null)

  useEffect(() => {
    if (!showScanMenu) return
    function handleClick(e) {
      if (scanMenuRef.current && !scanMenuRef.current.contains(e.target)) {
        setShowScanMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showScanMenu])

  const isNew = !book

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleScanned(isbn) {
    setScanning(false)
    setForm(f => ({ ...f, isbn }))
    setLookingUp(true)
    setError('')
    try {
      const { title, author, coverUrl } = await fetchBookByISBN(isbn)
      setForm(f => ({
        ...f,
        isbn,
        title: title || f.title,
        author: author || f.author,
        cover_url: coverUrl || f.cover_url,
      }))
    } catch (err) {
      setError(`Scan succeeded but lookup failed: ${err.message}. You can fill in details manually.`)
    } finally {
      setLookingUp(false)
    }
  }

  async function lookupISBN() {
    if (!form.isbn.trim()) return
    setLookingUp(true)
    setError('')
    try {
      const { title, author, coverUrl } = await fetchBookByISBN(form.isbn)
      setForm(f => ({
        ...f,
        title: title || f.title,
        author: author || f.author,
        cover_url: coverUrl || f.cover_url,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLookingUp(false)
    }
  }

  async function lookupTitle() {
    if (!form.title.trim()) return
    setLookingUp(true)
    setError('')
    try {
      const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(form.title)}&limit=1`)
      if (!res.ok) throw new Error(`Open Library returned ${res.status}. Try again later.`)
      const data = await res.json()
      const doc = data.docs?.[0]
      if (!doc) throw new Error('No results found for that title.')

      const coverId = doc.cover_i
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : ''
      const author = doc.author_name?.[0] || ''

      setForm(f => ({
        ...f,
        author: author || f.author,
        cover_url: coverUrl || f.cover_url,
        isbn: doc.isbn?.[0] || f.isbn,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLookingUp(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError('')

    const payload = { ...form }
    delete payload.id
    delete payload.created_at

    try {
      let result
      if (isNew) {
        result = await supabase.from('books').insert(payload).select().single()
      } else {
        result = await supabase.from('books').update(payload).eq('id', book.id).select().single()
      }
      if (result.error) throw result.error
      onSaved(result.data, isNew)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    {scanning === 'barcode' && (
      <BarcodeScanner
        onDetected={handleScanned}
        onClose={() => setScanning(false)}
      />
    )}
    {scanning === 'isbn' && (
      <ISBNScanner
        onDetected={handleScanned}
        onClose={() => setScanning(false)}
      />
    )}
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{isNew ? 'Add Book' : 'Edit Book'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          {/* ISBN lookup */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ISBN</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.isbn}
                onChange={e => set('isbn', e.target.value)}
                placeholder="e.g. 9780743273565"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="relative" ref={scanMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowScanMenu(v => !v)}
                  className="bg-amber-700 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                  title="Scan with camera"
                >
                  📷
                </button>
                {showScanMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden w-44">
                    <button
                      type="button"
                      onClick={() => { setScanning('barcode'); setShowScanMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 cursor-pointer border-b border-gray-100"
                    >
                      🔲 Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => { setScanning('isbn'); setShowScanMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 cursor-pointer"
                    >
                      🔢 Scan ISBN Text
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={lookupISBN}
                disabled={lookingUp || !form.isbn.trim()}
                className="bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {lookingUp ? '...' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                required
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={lookupTitle}
                disabled={lookingUp || !form.title.trim()}
                className="bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {lookingUp ? '...' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={e => set('author', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Genre</label>
            <input
              type="text"
              value={form.genre}
              onChange={e => set('genre', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Cover URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Image URL</label>
            <div className="flex gap-3 items-start">
              <input
                type="url"
                value={form.cover_url}
                onChange={e => set('cover_url', e.target.value)}
                placeholder="Auto-filled by lookup, or paste a URL"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {form.cover_url && (
                <img src={form.cover_url} alt="Cover preview" className="w-12 h-16 object-cover rounded border border-gray-200" />
              )}
            </div>
          </div>

          {/* Read status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Read Status</label>
            <select
              value={form.read_status}
              onChange={e => set('read_status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="unread">Unread</option>
              <option value="in_progress">In Progress</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bookcase</label>
              <input
                type="text"
                value={form.bookcase}
                onChange={e => set('bookcase', e.target.value)}
                placeholder="e.g. Living Room"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Shelf / Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. Top shelf"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-700 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : isNew ? 'Add Book' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

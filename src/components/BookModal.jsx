import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import BarcodeScanner from './BarcodeScanner'
import ISBNScanner from './ISBNScanner'
import StarRating from './StarRating'

const EMPTY_FORM = {
  title: '',
  author: '',
  genre: '',
  isbn: '',
  cover_url: '',
  read_status: 'unread',
  rating: null,
  bookcase: '',
  location: '',
  notes: '',
}

const GOOGLE_BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

function parseGoogleBook(item) {
  const info = item?.volumeInfo || {}
  const title = info.title || ''
  const author = info.authors?.[0] || ''
  const isbn = info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier
    || info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier
    || ''
  const coverUrl = info.imageLinks?.thumbnail?.replace('http://', 'https://') || ''
  return { title, author, isbn, coverUrl }
}

async function fetchBookByISBN(isbn) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn.trim()}&key=${GOOGLE_BOOKS_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Books returned ${res.status}. Try again later.`)
  const data = await res.json()
  if (!data.items?.length) throw new Error('ISBN not found in Google Books.')
  return parseGoogleBook(data.items[0])
}

async function fetchBookByTitle(title) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1&key=${GOOGLE_BOOKS_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Books returned ${res.status}. Try again later.`)
  const data = await res.json()
  if (!data.items?.length) throw new Error('No results found for that title.')
  return parseGoogleBook(data.items[0])
}

export default function BookModal({ book, userId, onClose, onSaved }) {
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
      const { author, isbn, coverUrl } = await fetchBookByTitle(form.title)
      setForm(f => ({
        ...f,
        author: author || f.author,
        cover_url: coverUrl || f.cover_url,
        isbn: isbn || f.isbn,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLookingUp(false)
    }
  }

  async function resync() {
    if (!form.isbn.trim()) return
    if (!confirm('This will potentially reset the title, author and cover art for this book. Would you like to proceed?')) return
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
      setError(`Resync failed: ${err.message}`)
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
        result = await supabase.from('books').insert({ ...payload, user_id: userId }).select().single()
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
          <div className="flex items-center gap-3">
            {!isNew && form.isbn && (
              <button
                type="button"
                onClick={resync}
                disabled={lookingUp}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                style={{ background: 'var(--t-btn2)', color: 'var(--t-btn2-text)' }}
                title="Re-fetch title, author, and cover from Google Books"
              >
                {lookingUp ? 'Syncing...' : '↻ Resync'}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
          </div>
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
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
              />
              <div className="relative" ref={scanMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowScanMenu(v => !v)}
                  className="text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  style={{ background: 'var(--t-btn)' }}
                  title="Scan with camera"
                >
                  📷
                </button>
                {showScanMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden w-44">
                    <button
                      type="button"
                      onClick={() => { setScanning('barcode'); setShowScanMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    >
                      🔲 Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => { setScanning('isbn'); setShowScanMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
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
                className="text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                style={{ background: 'var(--t-btn2)', color: 'var(--t-btn2-text)' }}
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
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
              />
              <button
                type="button"
                onClick={lookupTitle}
                disabled={lookingUp || !form.title.trim()}
                className="text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                style={{ background: 'var(--t-btn2)', color: 'var(--t-btn2-text)' }}
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Genre</label>
            <select
              value={form.genre}
              onChange={e => set('genre', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)] text-gray-700"
            >
              <option value="">— Select a genre —</option>
              <optgroup label="Fiction">
                <option>Literary Fiction</option>
                <option>Science Fiction</option>
                <option>Fantasy</option>
                <option>Mystery / Thriller</option>
                <option>Weird Fiction</option>
                <option>Horror</option>
                <option>Romance</option>
                <option>Historical Fiction</option>
                <option>Adventure</option>
                <option>Graphic Novel / Comics</option>
              </optgroup>
              <optgroup label="Non-Fiction">
                <option>Biography / Memoir</option>
                <option>History</option>
                <option>Science & Nature</option>
                <option>Self-Help / Personal Development</option>
                <option>Philosophy</option>
                <option>Psychology</option>
                <option>Politics & Society</option>
                <option>Business & Economics</option>
                <option>Travel</option>
                <option>True Crime</option>
                <option>Religion & Spirituality</option>
                <option>Art & Photography</option>
                <option>Cooking & Food</option>
                <option>Health & Fitness</option>
              </optgroup>
              <optgroup label="Other">
                <option>Poetry</option>
                <option>Drama / Plays</option>
                <option>Children's</option>
                <option>Reference / Textbooks</option>
              </optgroup>
            </select>
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
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
            >
              <option value="unread">Unread</option>
              <option value="in_progress">In Progress</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Rating</label>
            <StarRating value={form.rating} onChange={val => set('rating', val)} />
            {form.rating && (
              <button type="button" onClick={() => set('rating', null)} className="text-xs text-gray-400 hover:text-gray-600 mt-1 cursor-pointer">
                Clear rating
              </button>
            )}
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Shelf / Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. Top shelf"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)]"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--t-ring)] resize-none"
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
              className="text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--t-btn)' }}
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

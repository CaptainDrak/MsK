const STATUS_LABELS = {
  read: { label: 'Read', color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  unread: { label: 'Unread', color: 'bg-gray-100 text-gray-600' },
}

export default function BookGrid({ books, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {books.map(book => (
        <BookCard key={book.id} book={book} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}

function BookCard({ book, onEdit, onDelete }) {
  const status = STATUS_LABELS[book.read_status] || STATUS_LABELS.unread

  function handleDelete(e) {
    e.stopPropagation()
    onDelete(book.id)
  }

  return (
    <div
      onClick={() => onEdit(book)}
      className="rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer border"
      style={{ background: 'var(--t-card)', borderColor: 'var(--t-card-border)' }}
    >
      <div className="relative aspect-[2/3] bg-gray-100">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--t-card-border)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        <button
          onClick={handleDelete}
          className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors cursor-pointer"
          title="Delete book"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{book.title}</p>
        {book.author && <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>}
        <div className="mt-auto pt-1 flex flex-col gap-1">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium self-start ${status.color}`}>
            {status.label}
          </span>
          {book.bookcase && (
            <p className="text-xs truncate" style={{ color: 'var(--t-accent)' }}>
              {book.bookcase}{book.location ? ` · ${book.location}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

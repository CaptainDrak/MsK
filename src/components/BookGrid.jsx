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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <div className="relative aspect-[2/3] bg-amber-100">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(book)}
            className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(book.id)}
            className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{book.title}</p>
        {book.author && <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>}
        <div className="mt-auto pt-1 flex flex-col gap-1">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium self-start ${status.color}`}>
            {status.label}
          </span>
          {book.bookcase && (
            <p className="text-xs text-amber-700 truncate">{book.bookcase}{book.location ? ` · ${book.location}` : ''}</p>
          )}
        </div>
      </div>
    </div>
  )
}

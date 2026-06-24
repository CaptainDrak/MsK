export default function FilterBar({ search, onSearch, filterStatus, onFilterStatus, filterBookcase, onFilterBookcase, bookcases, onExportAll, onExportFiltered, filteredCount, totalCount }) {
  const inputClass = "border rounded-lg px-3 py-2 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2"
  const isFiltered = filteredCount !== totalCount

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Search title, author, genre..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className={`flex-1 min-w-48 ${inputClass}`}
        style={{ borderColor: 'var(--t-card-border)', '--tw-ring-color': 'var(--t-ring)' }}
      />
      <select
        value={filterStatus}
        onChange={e => onFilterStatus(e.target.value)}
        className={inputClass}
        style={{ borderColor: 'var(--t-card-border)', '--tw-ring-color': 'var(--t-ring)', color: '#374151' }}
      >
        <option value="all">All statuses</option>
        <option value="unread">Unread</option>
        <option value="in_progress">In Progress</option>
        <option value="read">Read</option>
      </select>
      <select
        value={filterBookcase}
        onChange={e => onFilterBookcase(e.target.value)}
        className={inputClass}
        style={{ borderColor: 'var(--t-card-border)', '--tw-ring-color': 'var(--t-ring)', color: '#374151' }}
      >
        <option value="all">All bookcases</option>
        {bookcases.map(bc => (
          <option key={bc} value={bc}>{bc}</option>
        ))}
      </select>

      <div className="flex gap-2 items-center">
        {isFiltered && (
          <button
            onClick={onExportFiltered}
            className="border rounded-lg px-3 py-2 text-sm font-medium bg-white cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--t-card-border)', color: 'var(--t-accent)' }}
            title={`Export ${filteredCount} filtered book${filteredCount !== 1 ? 's' : ''} as CSV`}
          >
            ↓ Export filtered ({filteredCount})
          </button>
        )}
        <button
          onClick={onExportAll}
          className="border rounded-lg px-3 py-2 text-sm font-medium bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ borderColor: 'var(--t-card-border)', color: 'var(--t-accent)' }}
          title={`Export all ${totalCount} books as CSV`}
        >
          ↓ Export all ({totalCount})
        </button>
      </div>
    </div>
  )
}

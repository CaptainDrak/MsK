export default function FilterBar({ search, onSearch, filterStatus, onFilterStatus, filterBookcase, onFilterBookcase, bookcases }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Search title, author, genre..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="flex-1 min-w-48 border border-amber-300 rounded-lg px-3 py-2 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <select
        value={filterStatus}
        onChange={e => onFilterStatus(e.target.value)}
        className="border border-amber-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="all">All statuses</option>
        <option value="unread">Unread</option>
        <option value="in_progress">In Progress</option>
        <option value="read">Read</option>
      </select>
      <select
        value={filterBookcase}
        onChange={e => onFilterBookcase(e.target.value)}
        className="border border-amber-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="all">All bookcases</option>
        {bookcases.map(bc => (
          <option key={bc} value={bc}>{bc}</option>
        ))}
      </select>
    </div>
  )
}

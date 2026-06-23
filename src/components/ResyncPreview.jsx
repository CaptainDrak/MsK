export default function ResyncPreview({ current, incoming, onConfirm, onCancel }) {
  const changes = []

  if (incoming.title && incoming.title !== current.title)
    changes.push({ field: 'Title', before: current.title, after: incoming.title })
  if (incoming.author && incoming.author !== current.author)
    changes.push({ field: 'Author', before: current.author, after: incoming.author })
  if (incoming.coverUrl && incoming.coverUrl !== current.cover_url)
    changes.push({ field: 'Cover Art', before: current.cover_url, after: incoming.coverUrl, isImage: true })

  if (changes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p className="text-gray-700 font-medium mb-1">No changes found.</p>
          <p className="text-gray-500 text-sm mb-6">Google Books matches what you already have.</p>
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Here's what will be changing:</h2>
        </div>

        <div className="px-6 py-4 flex flex-col gap-5">
          {changes.map(({ field, before, after, isImage }) => (
            <div key={field}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{field}</p>
              {isImage ? (
                <div className="flex items-start gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">Before</p>
                    {before
                      ? <img src={before} alt="Before" className="w-16 h-24 object-cover rounded border border-gray-200 mx-auto" />
                      : <div className="w-16 h-24 bg-gray-100 rounded border border-gray-200 mx-auto flex items-center justify-center text-gray-400 text-xs">None</div>
                    }
                  </div>
                  <div className="text-gray-400 self-center text-lg">→</div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">After</p>
                    <img src={after} alt="After" className="w-16 h-24 object-cover rounded border border-gray-200 mx-auto" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-gray-700 line-through opacity-70">
                    {before || <span className="italic text-gray-400">Empty</span>}
                  </div>
                  <div className="text-gray-400 self-center">→</div>
                  <div className="flex-1 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm text-gray-700">
                    {after}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(changes)}
            className="text-white font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ background: 'var(--t-btn)' }}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}

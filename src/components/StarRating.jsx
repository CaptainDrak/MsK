export default function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange(value === star ? null : star)}
          disabled={readOnly}
          className={`text-xl leading-none transition-transform ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          title={readOnly ? `${value} star${value !== 1 ? 's' : ''}` : `Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <span style={{ color: star <= (value || 0) ? '#f59e0b' : '#d1d5db' }}>★</span>
        </button>
      ))}
    </div>
  )
}

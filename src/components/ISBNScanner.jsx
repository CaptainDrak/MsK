import { useEffect, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'

// Extract a 10 or 13 digit ISBN from raw OCR text
function extractISBN(text) {
  // Strip hyphens and spaces, then look for 13 or 10 digit sequences
  const cleaned = text.replace(/[-\s]/g, '')
  const match13 = cleaned.match(/97[89]\d{10}/)
  if (match13) return match13[0]
  const match10 = cleaned.match(/\b\d{9}[\dXx]\b/)
  if (match10) return match10[0].toUpperCase()
  return null
}

export default function ISBNScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('starting') // starting | ready | scanning | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setStatus('ready')
      })
      .catch(() => {
        setErrorMsg('Camera access denied. Please allow camera permission and try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function capture() {
    if (status !== 'ready') return
    setStatus('scanning')

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        tessedit_char_whitelist: '0123456789Xx- ',
      })
      const isbn = extractISBN(text)
      if (isbn) {
        streamRef.current?.getTracks().forEach(t => t.stop())
        onDetected(isbn)
      } else {
        setStatus('ready')
        setErrorMsg('No ISBN found in the image. Try again — make sure the ISBN text is clearly visible and well-lit.')
      }
    } catch {
      setStatus('ready')
      setErrorMsg('OCR failed. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Scan ISBN Number</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
        </div>

        <div className="p-3 flex flex-col gap-3">
          {status === 'error' ? (
            <p className="text-red-600 text-sm text-center py-4">{errorMsg}</p>
          ) : (
            <>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {status === 'scanning' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <p className="text-white text-sm font-medium">Reading ISBN...</p>
                  </div>
                )}
                {/* Aim guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-amber-400 rounded w-3/4 h-12 opacity-70" />
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-600 text-xs text-center">{errorMsg}</p>
              )}

              <p className="text-gray-500 text-xs text-center">
                Point at the printed ISBN number on the back of the book, then tap Capture
              </p>

              <button
                onClick={capture}
                disabled={status !== 'ready'}
                className="disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: 'var(--t-btn)' }}
              >
                {status === 'scanning' ? 'Reading...' : 'Capture'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

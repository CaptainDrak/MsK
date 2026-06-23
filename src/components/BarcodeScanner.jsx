import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScanner({ onDetected, onClose }) {
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const detectedRef = useRef(false)
  const divId = 'barcode-scanner-div'

  useEffect(() => {
    const scanner = new Html5Qrcode(divId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 140 } },
      (decodedText) => {
        if (detectedRef.current) return
        detectedRef.current = true
        scanner.stop()
          .catch(() => {})
          .finally(() => onDetected(decodedText))
      },
      () => {}
    ).catch(() => {
      setError('Camera access denied. Please allow camera permission and try again.')
    })

    return () => {
      if (!detectedRef.current) {
        scanner.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
        </div>

        {error ? (
          <div className="p-6 text-center text-red-600 text-sm">{error}</div>
        ) : (
          <div className="p-3">
            <div id={divId} className="w-full rounded-lg overflow-hidden" />
            <p className="text-center text-gray-500 text-xs mt-3">Point your camera at the barcode on the back of the book</p>
          </div>
        )}
      </div>
    </div>
  )
}

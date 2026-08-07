'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area } from 'react-easy-crop'
import { X, ZoomIn } from 'lucide-react'

/**
 * Crop a local file before it ever reaches storage.
 *
 * Uploaded photos come off a phone at whatever shape the shot happened to be;
 * category and collection tiles are all the same shape. Cropping here means
 * that shape gets fixed once, by the person who can see what matters in the
 * photo, instead of a `object-cover` box doing it blindly at render time and
 * potentially slicing off exactly the part the shop owner meant to show.
 *
 * The crop happens entirely in the browser, on a `blob:` URL for the local
 * file — nothing is uploaded until the shop owner confirms the crop, so
 * cancelling here costs nothing.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = src
  })
}

async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not crop that image.')

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not crop that image.'))),
      'image/jpeg',
      0.92,
    )
  })
}

export function ImageCropModal({
  file,
  aspect = 1,
  onCancel,
  onCropped,
}: {
  file: File
  /** width / height. Square by default — every current use (category and
   *  collection tiles) renders `object-cover` in a square box. */
  aspect?: number
  onCancel: () => void
  onCropped: (blob: Blob) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // One object URL per file, released when the modal goes away — otherwise
  // every crop attempt leaks a blob URL for the lifetime of the tab.
  const src = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(src), [src])

  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  const confirm = async () => {
    if (!area) return
    setBusy(true)
    setError(null)
    try {
      onCropped(await cropToBlob(src, area))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not crop that image.')
      setBusy(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="adm fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crop image"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={{
          background: 'var(--adm-panel)',
          border: '1px solid var(--adm-line)',
          borderRadius: 'var(--adm-r)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--adm-line)' }}
        >
          <h2 className="adm-display text-[15px]" style={{ color: 'var(--adm-text)' }}>
            Crop image
          </h2>
          <button type="button" onClick={onCancel} className="adm-icon-btn" aria-label="Cancel">
            <X size={15} />
          </button>
        </div>

        <div className="p-5">
          <div
            className="relative w-full"
            style={{ height: 280, background: 'var(--adm-inset)', borderRadius: 'var(--adm-r-sm)', overflow: 'hidden' }}
          >
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <label className="flex items-center gap-2.5 mt-4">
            <ZoomIn size={14} style={{ color: 'var(--adm-text-3)' }} />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
              aria-label="Zoom"
            />
          </label>

          {error && (
            <p className="text-[11.5px] mt-2 leading-snug" style={{ color: 'var(--adm-bad)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={confirm}
              disabled={busy || !area}
              className="adm-btn adm-btn-primary flex-1"
            >
              {busy ? 'Cropping…' : 'Use this crop'}
            </button>
            <button type="button" onClick={onCancel} className="adm-btn adm-btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

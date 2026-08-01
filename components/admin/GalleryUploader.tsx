'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, Loader2, Star, Play, ArrowLeft, ArrowRight } from 'lucide-react'
import {
  fetchGallery,
  uploadImage,
  deleteImage,
  reorderGallery,
  addVideo,
  UploadError,
  MAX_IMAGES,
  type GalleryImage,
} from '@/lib/media'
import { useConfirm } from '@/components/ConfirmDialog'

/**
 * Up to five images per product, plus optional YouTube slides.
 *
 * The first image is the one customers see in listings, so it is labelled and
 * reorderable rather than hidden behind a "primary" checkbox.
 */
/** Thumbnails stay this size at every breakpoint. */
const TILE = 52

export default function GalleryUploader({ productId }: { productId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [showVideo, setShowVideo] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()

  const load = useCallback(async () => {
    try {
      setImages(await fetchGallery(productId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load images.')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const photos = images.filter((i) => i.type === 'IMAGE')
  const remaining = MAX_IMAGES - photos.length

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)

    const picked = Array.from(files)
    if (picked.length > remaining) {
      setError(
        remaining === 0
          ? `You already have ${MAX_IMAGES} images. Remove one first.`
          : `Only ${remaining} more image${remaining === 1 ? '' : 's'} allowed — the first ${remaining} will be used.`,
      )
    }

    setBusy(true)
    try {
      let position = images.length
      for (const file of picked.slice(0, remaining)) {
        await uploadImage(productId, file, position++)
      }
      await load()
    } catch (e) {
      setError(e instanceof UploadError ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const move = async (index: number, delta: number) => {
    const next = [...images]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next)
    await reorderGallery(next)
  }

  const remove = async (img: GalleryImage) => {
    const isMain = images[0]?.id === img.id
    const ok = await confirm({
      title: img.type === 'YOUTUBE' ? 'Remove video?' : 'Remove image?',
      message: isMain
        ? 'This is the main image customers see in listings. The next image will take its place.'
        : 'It will be deleted from storage and cannot be recovered.',
      confirmLabel: 'Remove',
    })
    if (!ok) return

    setBusy(true)
    try {
      await deleteImage(img)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="adm-eyebrow">Gallery</p>
        <span
          className="adm-num text-[11px]"
          style={{ color: remaining === 0 ? 'var(--adm-warn)' : 'var(--adm-text-3)' }}
        >
          {photos.length} / {MAX_IMAGES}
        </span>
      </div>

      {error && (
        <p
          className="text-[11.5px] px-3 py-2.5 mb-3"
          style={{
            background: 'color-mix(in srgb, var(--adm-bad) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--adm-bad) 26%, transparent)',
            color: 'var(--adm-bad)',
            borderRadius: 'var(--adm-r-sm)',
          }}
        >
          {error}
        </p>
      )}


      {/* Thumbnails — fixed size, so a large upload can't blow up the layout */}
      {loading ? (
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="skeleton shrink-0" style={{ width: TILE, height: TILE, borderRadius: 9 }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative group shrink-0"
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 9,
                overflow: 'hidden',
                background: 'var(--adm-inset)',
                border: i === 0 ? '1.5px solid var(--adm-accent)' : '1px solid var(--adm-line)',
                boxShadow: i === 0 ? '0 0 0 3px var(--adm-accent-soft)' : 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.type === 'YOUTUBE' ? (img.alt ?? img.url) : img.url}
                alt=""
                className="w-full h-full object-cover"
              />

              {img.type === 'YOUTUBE' && (
                <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <Play size={14} color="#fff" fill="#fff" />
                </span>
              )}

              {i === 0 && (
                <span
                  className="absolute top-0.5 left-0.5 flex items-center justify-center text-white"
                  style={{ background: 'var(--adm-accent)', borderRadius: 99, width: 13, height: 13 }}
                  title="Main image — shown in listings"
                >
                  <Star size={7} fill="#fff" />
                </span>
              )}

              {/* Controls appear on hover so the tiles stay readable at rest */}
              <div
                className="absolute inset-0 flex flex-col justify-between p-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 45%, rgba(0,0,0,0.6))' }}
              >
                <button
                  type="button"
                  onClick={() => remove(img)}
                  aria-label={`Remove ${img.type === 'YOUTUBE' ? 'video' : 'image'} ${i + 1}`}
                  className="self-end flex items-center justify-center"
                  style={{ width: 16, height: 16, borderRadius: 99, background: 'rgba(0,0,0,0.75)', color: '#fff' }}
                >
                  <X size={9} />
                </button>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${i + 1} earlier`}
                    className="flex items-center justify-center"
                    style={{ width: 16, height: 16, borderRadius: 99, background: 'rgba(0,0,0,0.75)', color: '#fff', opacity: i === 0 ? 0.25 : 1 }}
                  >
                    <ArrowLeft size={9} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label={`Move ${i + 1} later`}
                    className="flex items-center justify-center"
                    style={{ width: 16, height: 16, borderRadius: 99, background: 'rgba(0,0,0,0.75)', color: '#fff', opacity: i === images.length - 1 ? 0.25 : 1 }}
                  >
                    <ArrowRight size={9} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files) }}
              className="flex flex-col items-center justify-center gap-0.5 shrink-0 transition-colors"
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 9,
                border: `1px dashed ${dragging ? 'var(--adm-accent)' : 'var(--adm-line-strong)'}`,
                background: dragging ? 'var(--adm-accent-soft)' : 'transparent',
                color: dragging ? 'var(--adm-accent)' : 'var(--adm-text-3)',
              }}
              aria-label="Add images"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span className="text-[8px] font-bold uppercase tracking-wider">{busy ? '…' : 'Add'}</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {remaining === 0 ? (
        <p
          className="text-[10.5px] leading-snug mb-3 px-2.5 py-2"
          style={{
            background: 'color-mix(in srgb, var(--adm-warn) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--adm-warn) 26%, transparent)',
            color: 'var(--adm-warn)',
            borderRadius: 7,
          }}
        >
          Gallery full — remove one to add another.
        </p>
      ) : (
        <p className="text-[10.5px] leading-snug mb-3" style={{ color: 'var(--adm-text-3)' }}>
          JPG/PNG/WebP · max 5&nbsp;MB · drag or click. First image is the listing thumbnail.
        </p>
      )}

      {/* YouTube slide — collapsed by default to keep the panel short */}
      <div className="pt-3" style={{ borderTop: '1px solid var(--adm-line)' }}>
        <button
          type="button"
          onClick={() => setShowVideo((v) => !v)}
          className="text-[10.5px] font-bold uppercase tracking-wider transition-opacity hover:opacity-75"
          style={{ color: 'var(--adm-accent)', fontFamily: 'var(--font-outfit), Outfit' }}
        >
          {showVideo ? '− Hide video field' : '+ Add a YouTube video'}
        </button>
        <div className="flex gap-1.5 mt-2.5" style={{ display: showVideo ? 'flex' : 'none' }}>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="YouTube link"
            aria-label="YouTube link"
            className="adm-input flex-1"
            style={{ height: 34, fontSize: 12 }}
          />
          <button
            type="button"
            disabled={!videoUrl.trim() || busy}
            onClick={async () => {
              setError(null)
              setBusy(true)
              try {
                await addVideo(productId, videoUrl.trim(), images.length)
                setVideoUrl('')
                await load()
              } catch (e) {
                setError(e instanceof UploadError ? e.message : 'Could not add that video.')
              } finally {
                setBusy(false)
              }
            }}
            className="adm-btn adm-btn-ghost"
            style={{ height: 34, padding: '0 12px' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

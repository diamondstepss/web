'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, Loader2, Star, Play, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
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
import { AI_CREDITS_EVENT } from './AiDescriptionButton'

interface PhotoPreset {
  id: string
  label: string
  description: string
}

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

  // AI photo clean-up — hidden entirely when the add-on isn't connected.
  const [cleanConfigured, setCleanConfigured] = useState(false)
  const [presets, setPresets] = useState<PhotoPreset[]>([])
  const [creditsPerPhoto, setCreditsPerPhoto] = useState(5)
  const [showClean, setShowClean] = useState(false)
  const [cleanTargetId, setCleanTargetId] = useState('')
  const [cleanPreset, setCleanPreset] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [customPromptMaxLength, setCustomPromptMaxLength] = useState(300)
  const [cleanBusy, setCleanBusy] = useState(false)
  const [cleanNote, setCleanNote] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null)
  // Held across retries so a dropped reply is not charged twice.
  const cleanIdempotencyKey = useRef<string | null>(null)

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
    let ignore = false
    fetchGallery(productId)
      .then((data) => {
        if (!ignore) setImages(data)
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof Error ? e.message : 'Could not load images.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [productId])

  useEffect(() => {
    let alive = true
    fetch('/api/admin/ai/photo')
      .then((r) => r.json())
      .then(
        (d: {
          configured?: boolean
          presets?: PhotoPreset[]
          creditsPerPhoto?: number
          customPromptMaxLength?: number
        }) => {
          if (!alive) return
          setCleanConfigured(Boolean(d.configured))
          if (d.presets) setPresets(d.presets)
          if (d.presets?.[0]) setCleanPreset((p) => p || d.presets![0].id)
          if (typeof d.creditsPerPhoto === 'number') setCreditsPerPhoto(d.creditsPerPhoto)
          if (typeof d.customPromptMaxLength === 'number') setCustomPromptMaxLength(d.customPromptMaxLength)
        },
      )
      .catch(() => alive && setCleanConfigured(false))
    return () => {
      alive = false
    }
  }, [])

  const photos = images.filter((i) => i.type === 'IMAGE')
  const remaining = MAX_IMAGES - photos.length

  // Derived rather than synced: defaulting to the main image needs no effect
  // when it can just fall back at read time.
  const effectiveCleanTarget = cleanTargetId || photos[0]?.id || ''

  const trimmedPrompt = customPrompt.trim()

  const runCleanup = async () => {
    if (!effectiveCleanTarget || (!cleanPreset && !trimmedPrompt)) return

    const ok = await confirm({
      title: 'Clean up this photo?',
      message: `The current image will be replaced with the ${trimmedPrompt ? 'restyled' : 'cleaned-up'} version. This uses ${creditsPerPhoto} credit${creditsPerPhoto === 1 ? '' : 's'}.`,
      confirmLabel: 'Clean up',
      destructive: false,
    })
    if (!ok) return

    setCleanBusy(true)
    setCleanNote(null)
    cleanIdempotencyKey.current ??= crypto.randomUUID()

    try {
      const res = await fetch('/api/admin/ai/photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId: effectiveCleanTarget,
          ...(trimmedPrompt ? { customPrompt: trimmedPrompt } : { presetId: cleanPreset }),
          idempotencyKey: cleanIdempotencyKey.current,
        }),
      })
      const data = (await res.json()) as {
        url?: string
        creditsCharged?: number
        creditsRemaining?: number
        temporaryUrl?: string
        error?: string
      }

      if (!res.ok) {
        if (res.status === 402) window.dispatchEvent(new CustomEvent(AI_CREDITS_EVENT))
        setCleanNote({
          text: data.temporaryUrl
            ? `${data.error ?? 'Could not save it.'} Grab it quickly: ${data.temporaryUrl}`
            : data.error ?? 'That did not work.',
          tone: 'bad',
        })
        return
      }

      await load()
      window.dispatchEvent(new CustomEvent(AI_CREDITS_EVENT, { detail: { credits: data.creditsRemaining } }))
      cleanIdempotencyKey.current = null
      setCustomPrompt('')
      setCleanNote({
        text: `${data.creditsCharged ?? creditsPerPhoto} credits used · ${data.creditsRemaining ?? 0} left.`,
        tone: 'ok',
      })
    } catch {
      setCleanNote({ text: 'Could not reach the server.', tone: 'bad' })
    } finally {
      setCleanBusy(false)
    }
  }

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

      {/* AI photo clean-up — the section itself doesn't render for a shop that
          hasn't connected the add-on, same as the credits chip in the header. */}
      {cleanConfigured && photos.length > 0 && (
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--adm-line)' }}>
          <button
            type="button"
            onClick={() => setShowClean((v) => !v)}
            className="text-[10.5px] font-bold uppercase tracking-wider transition-opacity hover:opacity-75"
            style={{ color: 'var(--adm-accent)', fontFamily: 'var(--font-outfit), Outfit' }}
          >
            {showClean ? '− Hide photo clean-up' : '+ Clean up a photo with AI'}
          </button>

          {showClean && (
            <div className="mt-2.5 space-y-2">
              <p className="text-[10.5px] leading-snug" style={{ color: 'var(--adm-text-3)' }}>
                Pick a preset, or describe your own background below. Either way it edits the photo
                you already have — it never invents or alters the product itself.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="block mb-1 text-[10.5px]" style={{ color: 'var(--adm-text-3)' }}>
                    Photo
                  </span>
                  <select
                    value={effectiveCleanTarget}
                    onChange={(e) => setCleanTargetId(e.target.value)}
                    className="adm-input"
                    style={{ height: 32 }}
                  >
                    {photos.map((img, i) => (
                      <option key={img.id} value={img.id}>
                        {i === 0 ? 'Main image' : `Image ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block mb-1 text-[10.5px]" style={{ color: 'var(--adm-text-3)' }}>
                    Preset
                  </span>
                  <select
                    value={cleanPreset}
                    onChange={(e) => setCleanPreset(e.target.value)}
                    disabled={Boolean(trimmedPrompt)}
                    className="adm-input"
                    style={{ height: 32, opacity: trimmedPrompt ? 0.5 : 1 }}
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id} title={p.description}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="flex items-baseline justify-between mb-1">
                  <span className="text-[10.5px]" style={{ color: 'var(--adm-text-3)' }}>
                    Or describe your own background/design
                  </span>
                  <span className="text-[9.5px]" style={{ color: 'var(--adm-text-3)' }}>
                    {customPrompt.length}/{customPromptMaxLength}
                  </span>
                </span>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value.slice(0, customPromptMaxLength))}
                  placeholder="e.g. a marble pedestal with soft golden light, or a festive Diwali diya arrangement"
                  rows={2}
                  className="adm-input"
                  style={{ resize: 'none' }}
                />
                <span className="block mt-1 text-[10px] leading-snug" style={{ color: 'var(--adm-text-3)' }}>
                  Describes the backdrop only — the product itself is never altered, whatever you ask for.
                </span>
              </label>

              <button
                type="button"
                onClick={runCleanup}
                disabled={cleanBusy || !effectiveCleanTarget || (!cleanPreset && !trimmedPrompt)}
                className="adm-btn adm-btn-primary w-full"
                style={{ height: 32 }}
              >
                {cleanBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {cleanBusy
                  ? 'Cleaning up… about a minute'
                  : `Clean up — ${creditsPerPhoto} credit${creditsPerPhoto === 1 ? '' : 's'}`}
              </button>
            </div>
          )}

          {cleanNote && (
            <p
              className="text-[10.5px] mt-1.5 leading-snug"
              style={{ color: cleanNote.tone === 'ok' ? 'var(--adm-ok)' : 'var(--adm-bad)' }}
            >
              {cleanNote.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

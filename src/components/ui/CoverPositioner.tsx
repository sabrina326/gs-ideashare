'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

interface CoverPositionerProps {
  imageUrl: string
  position: number // 0-100 percentage
  onChange: (position: number) => void
  onClose: () => void
}

export function CoverPositioner({ imageUrl, position, onChange, onClose }: CoverPositionerProps) {
  const [pos, setPos] = useState(position)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientY: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const y = clientY - rect.top
    const pct = Math.max(0, Math.min(100, (y / rect.height) * 100))
    setPos(Math.round(pct))
  }, [])

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    handleMove(e.clientY)
  }, [handleMove])

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY)
    const onMouseUp = () => setDragging(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, handleMove])

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true)
    handleMove(e.touches[0].clientY)
  }, [handleMove])

  useEffect(() => {
    if (!dragging) return
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientY)
    }
    const onTouchEnd = () => setDragging(false)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [dragging, handleMove])

  function handleSave() {
    onChange(pos)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-white rounded-2xl overflow-hidden max-w-md w-[90vw] mx-4"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#e5ddd3]">
          <p className="text-sm font-semibold text-[#2C2C2C]" style={{ fontFamily: 'var(--font-display)' }}>
            Reposition Cover Photo
          </p>
          <p className="text-xs text-[#888] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
            Drag up or down to adjust what's visible
          </p>
        </div>

        {/* Preview area — simulates the card crop */}
        <div className="px-4 pt-3">
          <p className="text-[10px] font-semibold text-[#888] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
            Card preview
          </p>
          <div className="relative h-44 rounded-xl overflow-hidden bg-[#e8f5ee] mb-3">
            <Image
              src={imageUrl}
              alt="Cover preview"
              fill
              className="object-cover"
              style={{ objectPosition: `center ${pos}%` }}
              sizes="400px"
            />
          </div>
        </div>

        {/* Drag area */}
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-[#888] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
            Drag to reposition
          </p>
          <div
            ref={containerRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="relative h-56 rounded-xl overflow-hidden bg-[#e8f5ee] cursor-ns-resize select-none"
            role="slider"
            aria-label="Adjust cover photo position"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pos}
          >
            <Image
              src={imageUrl}
              alt="Full photo"
              fill
              className="object-cover pointer-events-none"
              sizes="400px"
            />
            {/* Position line indicator */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-white shadow-sm transition-[top] pointer-events-none"
              style={{ top: `${pos}%`, boxShadow: '0 0 6px rgba(0,0,0,0.5)' }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center pointer-events-none transition-[top]"
              style={{ top: `calc(${pos}% - 16px)` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D7A4C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 21 6 15" />
                <polyline points="6 9 12 3 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-3 border-t border-[#e5ddd3]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex-1 justify-center py-2 text-sm"
          >
            Save Position
          </button>
        </div>
      </div>
    </div>
  )
}

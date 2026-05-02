// ===== Feed 容器 =====

import { useState, useRef, useEffect } from 'react'
import { type Content } from '../lib/contentData'
import ContentRenderer from './ContentRenderer'
import FeedControls from './FeedControls'
import ContentInfo from './ContentInfo'

export default function FeedContainer({ contents, user, onMeme }: { contents: Content[]; user: any; onMeme?: (c: Content) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const currentContent = contents[currentIndex]

  const goTo = (i: number) => { if (i >= 0 && i < contents.length) setCurrentIndex(i) }
  const goNext = () => goTo(currentIndex + 1)
  const goPrev = () => goTo(currentIndex - 1)

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchMove = (e: React.TouchEvent) => { touchEndY.current = e.touches[0].clientY }
  const handleTouchEnd = () => { const d = touchStartY.current - touchEndY.current; if (Math.abs(d) > 50) { d > 0 ? goNext() : goPrev() } }
  const handleWheel = (e: React.WheelEvent) => { if (e.deltaY > 30) goNext(); else if (e.deltaY < -30) goPrev() }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key === 'j') goNext(); else if (e.key === 'ArrowUp' || e.key === 'k') goPrev() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [currentIndex])

  if (!currentContent) return <div className="w-full h-screen bg-black flex items-center justify-center"><p className="text-white/50">没有更多内容了</p></div>

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
      <ContentRenderer content={currentContent} isActive={true} />
      <ContentInfo content={currentContent} />
      <FeedControls content={currentContent} user={user} onMeme={() => onMeme?.(currentContent)} />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"><span className="text-white/40 text-xs">{currentIndex + 1} / {contents.length}</span></div>
    </div>
  )
}

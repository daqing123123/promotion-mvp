// ===== Feed 右侧按钮 =====

import { useState } from 'react'
import { type Content } from '../lib/contentData'
import { formatStat } from '../lib/memeSystem'
import CommentSheet from './CommentSheet'

export default function FeedControls({ content, user, onMeme }: { content: Content; user: any; onMeme?: () => void }) {
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showComments, setShowComments] = useState(false)

  return (
    <>
      <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-4">
        <button className="relative mb-2">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl border-2 border-white">{content.creator.avatar}</div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">+</span></div>
        </button>
        <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{liked ? '❤️' : '🤍'}</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.likes + (liked ? 1 : 0))}</span>
        </button>
        <button onClick={onMeme} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">💡</span>
          <span className="text-white text-[11px]">造梗</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">💬</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.comments)}</span>
        </button>
        <button onClick={() => setFavorited(!favorited)} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{favorited ? '⭐' : '☆'}</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.favorites + (favorited ? 1 : 0))}</span>
        </button>
        <button className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">↗️</span>
          <span className="text-white text-[11px]">{formatStat(content.stats.shares)}</span>
        </button>
      </div>

      {/* 评论底部弹窗 */}
      {showComments && (
        <CommentSheet
          contentId={content.id}
          source={content.type === 'content' ? 'contents' : 'memes'}
          userId={user?.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  )
}

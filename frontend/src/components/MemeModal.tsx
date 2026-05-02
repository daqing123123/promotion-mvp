import { useState } from 'react'

interface MemeModalProps {
  /** 关联的内容/话题标题 */
  targetTitle: string
  /** 关闭弹窗 */
  onClose: () => void
  /** 提交成功回调 */
  onSuccess?: (meme: { type: string; title: string; content: string; hashtags: string[] }) => void
}

const MEME_TYPES = [
  { type: 'text', icon: '📝', label: '文案梗' },
  { type: 'image', icon: '🖼️', label: '图片梗' },
  { type: 'hashtag', icon: '🏷️', label: '话题梗' },
]

export default function MemeModal({ targetTitle, onClose, onSuccess }: MemeModalProps) {
  const [memeType, setMemeType] = useState<'text' | 'image' | 'hashtag'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')

  const canSubmit = title.trim() && content.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onSuccess?.({
      type: memeType,
      title: title.trim(),
      content: content.trim(),
      hashtags: hashtags.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[85vh] rounded-t-3xl flex flex-col animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">💡 造梗</h2>
            <p className="text-xs text-gray-400 mt-0.5">为「{targetTitle.length > 20 ? targetTitle.slice(0, 20) + '...' : targetTitle}」造一个梗</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            ✕
          </button>
        </div>

        {/* 表单 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 梗类型 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">梗类型</label>
            <div className="grid grid-cols-3 gap-3">
              {MEME_TYPES.map(t => (
                <button
                  key={t.type}
                  onClick={() => setMemeType(t.type as any)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    memeType === t.type ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-xs">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 标题 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">梗标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给你的梗起个标题"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {memeType === 'text' ? '文案内容' : memeType === 'image' ? '图片链接' : '话题标签'}
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                memeType === 'text' ? '写下你的梗...' :
                memeType === 'image' ? '输入图片URL...' :
                '输入话题标签，如 #国产片之光'
              }
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">话题标签</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="用逗号分隔，如：国产片之光,年度最佳"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3 rounded-2xl font-bold text-base transition-all ${
              canSubmit
                ? 'bg-black text-white active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            发布梗
          </button>
        </div>
      </div>
    </div>
  )
}

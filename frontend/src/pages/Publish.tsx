import { useState } from 'react'

export default function Publish({ user: _user, isMobile: _isMobile }: { user: any; isMobile: boolean }) {
  const [content, setContent] = useState('')
  const [format, setFormat] = useState<'text' | 'image' | 'music' | 'video'>('text')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handlePublish = () => {
    if (!content.trim()) return
    setLoading(true)
    setTimeout(() => { setDone(true); setLoading(false) }, 800)
  }

  if (done) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-8 w-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">发布成功</h2>
          <p className="text-sm text-gray-500 mb-8">你的内容已进入盲盒池，等待被发现</p>
          <a href="/" className="inline-block px-8 py-3 bg-black text-white rounded-2xl font-semibold text-sm">去拆盲盒</a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 w-full">
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-40 px-5 pt-3 pb-3">
        <h1 className="text-xl font-bold text-gray-900">发布内容</h1>
      </header>

      <div className="p-5 space-y-4">
        <div>
          <label className="text-sm text-gray-500 mb-2 block">内容类型</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: 'text', l: '文字', i: '📝' },
              { v: 'image', l: '图片', i: '📷' },
              { v: 'music', l: '音乐', i: '🎵' },
              { v: 'video', l: '视频', i: '🎬' },
            ].map(f => (
              <button key={f.v} onClick={() => setFormat(f.v as any)}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 text-sm transition-all ${format === f.v ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>
                <span className="text-lg">{f.i}</span>
                <span className="text-xs">{f.l}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="分享你的创意、作品、想法..."
            className="w-full h-40 bg-white border-0 rounded-2xl p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none text-sm" />
          <div className="text-right text-[11px] text-gray-300 mt-1">{content.length} 字</div>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-2 block">话题标签</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(t => (
              <span key={t} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
                #{t}
                <button onClick={() => setTags(ts => ts.filter(x => x !== t))} className="text-gray-400 ml-0.5">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="添加话题"
              className="flex-1 px-4 py-2.5 bg-white border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { setTags(ts => [...ts, newTag.trim()]); setNewTag('') } }} />
            <button onClick={() => { if (newTag.trim()) { setTags(ts => [...ts, newTag.trim()]); setNewTag('') } }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">添加</button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-sm font-medium text-blue-600 mb-0.5">小贴士</div>
              <div className="text-xs text-blue-500/70">发布的内容会进入盲盒池，被其他用户随机发现。有趣的、有共鸣的内容更容易被帮推。</div>
            </div>
          </div>
        </div>

        <button onClick={handlePublish} disabled={loading || !content.trim()}
          className="w-full py-3.5 bg-black text-white rounded-2xl font-semibold text-sm disabled:opacity-30 hover:bg-gray-800 active:scale-[0.98] transition-all">
          {loading ? '发布中...' : '发布到盲盒池'}
        </button>
      </div>
    </div>
  )
}

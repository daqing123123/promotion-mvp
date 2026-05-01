// ===== 发布页面 =====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'

const CONTENT_TYPES = [
  { key: 'video', icon: '🎬', label: '视频', enabled: true },
  { key: 'image', icon: '🖼️', label: '图片', enabled: true },
  { key: 'content', icon: '📝', label: '文字', enabled: true },
  { key: 'article', icon: '📄', label: '文章', enabled: false },
  { key: 'software', icon: '💻', label: '软件', enabled: false },
  { key: 'skill', icon: '🧠', label: 'Skill', enabled: false },
  { key: 'agent', icon: '🤖', label: 'Agent', enabled: false },
  { key: 'product', icon: '📦', label: '产品', enabled: false },
  { key: 'game', icon: '🎮', label: '游戏', enabled: false },
  { key: 'movie', icon: '🎬', label: '影视', enabled: false },
  { key: 'music', icon: '🎵', label: '音乐', enabled: false },
  { key: 'drama', icon: '🎭', label: '短剧', enabled: false },
  { key: 'person', icon: '👤', label: '人物', enabled: false },
  { key: 'live', icon: '📡', label: '直播', enabled: false },
  { key: 'blindbox', icon: '🎁', label: '盲盒', enabled: false },
]

interface FormData {
  title: string
  description: string
  content: string
  tags: string
  coverUrl: string
  videoUrl: string
  imageUrl: string
}

export default function PublishV2({ user }: { user: any; isMobile?: boolean }) {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState('')
  const [form, setForm] = useState<FormData>({
    title: '', description: '', content: '', tags: '', coverUrl: '', videoUrl: '', imageUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }))

  const canPublish = selectedType && form.title.trim() && (
    (selectedType === 'content' && form.content.trim()) ||
    (selectedType === 'video' && form.videoUrl.trim()) ||
    (selectedType === 'image' && form.imageUrl.trim()) ||
    (selectedType !== 'content' && selectedType !== 'video' && selectedType !== 'image')
  )

  const handlePublish = async () => {
    if (!canPublish) return
    setLoading(true)
    setError('')

    try {
      const tags = form.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean)

      let description = form.description
      if (selectedType === 'content') {
        description = form.content
      }

      const contentData: any = {
        type: selectedType,
        title: form.title.trim(),
        description: description.trim(),
        tags,
        creator_id: user.id,
        render_mode: selectedType === 'video' ? 'player' : selectedType === 'image' ? 'card' : 'card',
        cover_url: form.coverUrl || form.imageUrl || '',
        render_src: form.videoUrl || form.imageUrl || '',
        render_config: {},
        view_count: 0,
        like_count: 0,
        promote_count: 0,
        share_count: 0,
        comment_count: 0,
        favorite_count: 0,
        status: 'published',
      }

      const { error: dbError } = await supabase.from('contents').insert(contentData)
      if (dbError) throw dbError

      navigate('/')
    } catch (err: any) {
      setError(err.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400">←</button>
          <h1 className="text-xl font-bold text-gray-900">发布内容</h1>
        </div>
      </div>

      {/* 类型选择 */}
      <div className="bg-white px-5 py-4 mb-3">
        <h2 className="text-sm font-medium text-gray-500 mb-3">选择内容类型</h2>
        <div className="grid grid-cols-5 gap-2">
          {CONTENT_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => t.enabled && setSelectedType(t.key)}
              disabled={!t.enabled}
              className={`p-3 rounded-xl text-center transition-all relative ${
                !t.enabled
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : selectedType === t.key
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-600 active:bg-gray-100'
              }`}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-[10px]">{t.label}</div>
              {!t.enabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl">
                  <span className="text-[8px] text-gray-400">暂未开发</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 表单 */}
      {selectedType && (
        <div className="bg-white px-5 py-4 space-y-4">
          {/* 标题 - 所有类型都有 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {selectedType === 'content' ? '想法/观点' : '标题'}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder={
                selectedType === 'content' ? '分享你的想法...' :
                selectedType === 'video' ? '给视频起个标题...' :
                selectedType === 'image' ? '给图片起个标题...' :
                '起个标题'
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* 文字内容 - 只有文字类型显示 */}
          {selectedType === 'content' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">内容</label>
              <textarea
                value={form.content}
                onChange={e => update('content', e.target.value)}
                placeholder="写下你想说的..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          )}

          {/* 视频链接 - 只有视频类型显示 */}
          {selectedType === 'video' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">视频链接</label>
              <input
                type="text"
                value={form.videoUrl}
                onChange={e => update('videoUrl', e.target.value)}
                placeholder="粘贴视频URL（支持B站、抖音等）"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          )}

          {/* 图片链接 - 只有图片类型显示 */}
          {selectedType === 'image' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">图片链接</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={e => update('imageUrl', e.target.value)}
                placeholder="粘贴图片URL"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          )}

          {/* 封面 - 视频和图片类型显示 */}
          {(selectedType === 'video' || selectedType === 'image') && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">封面图URL（可选）</label>
              <input
                type="text"
                value={form.coverUrl}
                onChange={e => update('coverUrl', e.target.value)}
                placeholder="自定义封面图链接"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          )}

          {/* 描述 - 视频和图片类型显示 */}
          {(selectedType === 'video' || selectedType === 'image') && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">描述</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="添加描述..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          )}

          {/* 标签 - 所有类型都有 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">话题标签</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => update('tags', e.target.value)}
              placeholder="用逗号分隔，如：国产片之光,年度最佳"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

          <button
            onClick={handlePublish}
            disabled={!canPublish || loading}
            className={`w-full py-3 rounded-2xl font-bold text-base transition-all ${
              canPublish && !loading
                ? 'bg-black text-white active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {loading ? '发布中...' : '发布'}
          </button>
        </div>
      )}

      {!selectedType && (
        <div className="text-center py-10 text-gray-400 text-sm">请选择内容类型</div>
      )}
    </div>
  )
}

import { useState } from 'react'

interface SharePosterProps {
  contentId: string
  onClose: () => void
}

export default function SharePoster({ contentId, onClose }: SharePosterProps) {
  const [downloading, setDownloading] = useState(false)

  const content = {
    id: contentId,
    title: '夏日穿搭挑战！这个搭配太绝了！',
    creator: { name: '时尚达人小美', avatar: '👗' },
    stats: { views: 12345, likes: 890, recommends: 123 },
    tags: ['穿搭', '夏日', '时尚'],
  }

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      alert('海报已保存到相册')
    }, 1000)
  }

  const handleShare = (platform: string) => {
    alert(`已分享到${platform}`)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-secondary p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">{content.creator.avatar}</div>
            <div>
              <div className="font-bold text-white">{content.creator.name}</div>
              <div className="text-white/60 text-xs">在巨浪分享了精彩内容</div>
            </div>
          </div>
          
          <h3 className="text-white font-bold text-lg mb-4">{content.title}</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.map(tag => <span key={tag} className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">#{tag}</span>)}
          </div>

          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span>👁 {content.stats.views}</span>
            <span>❤️ {content.stats.likes}</span>
            <span>⭐ {content.stats.recommends}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">巨</span>
              </div>
              <span className="text-xl font-bold text-gray-900">巨浪</span>
            </div>
            <p className="text-gray-500 text-sm">你的亮点，世界看得见</p>
          </div>

          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-2">扫码查看内容</div>
              <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center">
                <div className="text-gray-400 text-sm">二维码</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={handleDownload} disabled={downloading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50">
              {downloading ? '保存中...' : '保存海报'}
            </button>
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">
              关闭
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-4">分享到</div>
          <div className="grid grid-cols-4 gap-3">
            <button onClick={() => handleShare('微信')} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl">💬</div>
              <span className="text-xs text-gray-600">微信</span>
            </button>
            <button onClick={() => handleShare('朋友圈')} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl">📱</div>
              <span className="text-xs text-gray-600">朋友圈</span>
            </button>
            <button onClick={() => handleShare('小红书')} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white text-xl">📌</div>
              <span className="text-xs text-gray-600">小红书</span>
            </button>
            <button onClick={() => handleShare('抖音')} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white text-xl">🎵</div>
              <span className="text-xs text-gray-600">抖音</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

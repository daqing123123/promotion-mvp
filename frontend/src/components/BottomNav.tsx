// ===== 底部导航栏（大厂风格） =====

import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/', icon: '🏠', label: '首页', activeIcon: '🏠' },
  { path: '/topics', icon: '🔥', label: '话题', activeIcon: '🔥' },
  { path: '/publish', icon: '➕', label: '', isCenter: true },
  { path: '/chat', icon: '💬', label: '聊天', activeIcon: '💬', badge: 0 },
  { path: '/profile', icon: '👤', label: '我的', activeIcon: '👤' },
]

export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  // 某些页面隐藏底部导航
  const hidePaths = ['/login', '/register', '/publish']
  if (hidePaths.some(p => currentPath.startsWith(p))) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* 安全区域背景 */}
      <div className="bg-white border-t border-gray-100 pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {TABS.map(tab => {
            const isActive = tab.path === '/' ? currentPath === '/' : currentPath.startsWith(tab.path)
            const badge = tab.path === '/chat' ? unreadCount : 0

            if (tab.isCenter) {
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="relative -mt-6"
                >
                  <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg shadow-black/20 active:scale-90 transition-transform">
                    <span className="text-white text-2xl">+</span>
                  </div>
                </button>
              )
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 min-w-[56px] py-1.5"
              >
                <div className="relative">
                  <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {isActive ? tab.activeIcon : tab.icon}
                  </span>
                  {badge > 0 && (
                    <div className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                      <span className="text-white text-[10px] font-bold">{badge > 99 ? '99+' : badge}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-0.5 w-5 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

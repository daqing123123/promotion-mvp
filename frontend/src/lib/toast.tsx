// ===== 全局 Toast 系统 =====
// 用法：import { toast } from '../lib/toast'
// toast.success('操作成功') / toast.error('失败') / toast.info('提示')

import React from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  type?: ToastType
  duration?: number
  icon?: string
}

let _showToast: ((msg: string, opts: ToastOptions) => void) | null = null

export function toast(msg: string, opts: ToastOptions = {}) {
  if (_showToast) {
    _showToast(msg, opts)
  }
}

toast.success = (msg: string) => toast(msg, { type: 'success', icon: '✅' })
toast.error = (msg: string) => toast(msg, { type: 'error', icon: '❌' })
toast.info = (msg: string) => toast(msg, { type: 'info', icon: 'ℹ️' })
toast.warning = (msg: string) => toast(msg, { type: 'warning', icon: '⚠️' })
toast.points = (pts: number) => toast(`+${pts} 积分`, { type: 'success', icon: '💰' })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<{ id: number; msg: string; opts: ToastOptions }>>([])
  const counter = React.useRef(0)

  React.useEffect(() => {
    _showToast = (msg: string, opts: ToastOptions) => {
      const id = ++counter.current
      setToasts(prev => [...prev, { id, msg, opts }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, opts.duration || 2500)
    }
    return () => { _showToast = null }
  }, [])

  const bgColor = (type?: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'warning': return 'bg-amber-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-900'
    }
  }

  return (
    <>
      {children}
      {/* Toast 容器 */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${bgColor(t.opts.type)} text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg backdrop-blur-sm animate-toast-in flex items-center gap-2 min-w-[120px] justify-center`}
            style={{ animation: 'toast-in 0.3s ease-out' }}
          >
            {t.opts.icon && <span>{t.opts.icon}</span>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}

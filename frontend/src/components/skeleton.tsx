// ===== 骨架屏组件 =====

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <div className="bg-gray-200 animate-pulse rounded-full" style={{ width: size, height: size }} />
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`bg-gray-200 animate-pulse rounded h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

// Feed 卡片骨架屏
export function FeedCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-1/3" />
          <SkeletonBlock className="h-2 w-1/4" />
        </div>
      </div>
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-5/6" />
      <SkeletonBlock className="h-48 w-full rounded-xl" />
      <div className="flex gap-4">
        <SkeletonBlock className="h-3 w-12" />
        <SkeletonBlock className="h-3 w-12" />
        <SkeletonBlock className="h-3 w-12" />
      </div>
    </div>
  )
}

// 全屏 Feed 骨架屏（竖屏）
export function FeedFullSkeleton() {
  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-end pb-32 px-5">
      <div className="w-full space-y-3">
        <SkeletonBlock className="h-4 w-2/3 bg-white/20" />
        <SkeletonBlock className="h-3 w-full bg-white/10" />
        <SkeletonBlock className="h-3 w-4/5 bg-white/10" />
      </div>
    </div>
  )
}

// 话题卡片骨架屏
export function TopicCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3">
      <div className="flex gap-2">
        <SkeletonBlock className="h-5 w-16 rounded-full" />
        <SkeletonBlock className="h-5 w-12 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-full" />
      <div className="flex items-center gap-2">
        <SkeletonCircle size={24} />
        <SkeletonBlock className="h-3 w-20" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-12" />
      </div>
    </div>
  )
}

// 列表骨架屏
export function ListSkeleton({ count = 5, variant = 'card' }: { count?: number; variant?: 'card' | 'compact' }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: count }).map((_, i) => (
        variant === 'card' ? <FeedCardSkeleton key={i} /> : (
          <div key={i} className="flex items-center gap-3 p-3">
            <SkeletonCircle size={48} />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-1/2" />
              <SkeletonBlock className="h-2 w-1/3" />
            </div>
          </div>
        )
      ))}
    </div>
  )
}

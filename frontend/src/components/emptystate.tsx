// ===== 空状态组件 =====

interface EmptyStateProps {
  icon?: string
  title: string
  desc?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon = '📭', title, desc, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>{icon}</div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      {desc && <p className="text-sm text-gray-400 mb-4 max-w-[240px]">{desc}</p>}
      {action && (
        <button onClick={action.onClick} className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium active:scale-95 transition-transform">
          {action.label}
        </button>
      )}
    </div>
  )
}

// 预设空状态
export function EmptyFeed({ onPublish }: { onPublish?: () => void }) {
  return <EmptyState icon="🌊" title="还没有内容" desc="成为第一个发布内容的人吧" action={onPublish ? { label: '去发布', onClick: onPublish } : undefined} />
}

export function EmptyComments() {
  return <EmptyState icon="💬" title="还没有评论" desc="来说两句吧" />
}

export function EmptyTopics() {
  return <EmptyState icon="🔥" title="暂无话题" desc="等你来发起第一个话题" />
}

export function EmptyPromotes() {
  return <EmptyState icon="📢" title="暂无推广" desc="去发现更多推广机会" />
}

export function EmptyNotifications() {
  return <EmptyState icon="🔔" title="暂无通知" desc="有新消息会通知你" />
}

export function EmptySearch() {
  return <EmptyState icon="🔍" title="没有找到结果" desc="换个关键词试试" />
}

export function EmptyCoupons() {
  return <EmptyState icon="🎫" title="暂无优惠券" desc="参与推广任务领取优惠券" />
}

export function EmptyInvites() {
  return <EmptyState icon="👥" title="还没有邀请记录" desc="分享邀请码给好友，双方都得奖励" />
}

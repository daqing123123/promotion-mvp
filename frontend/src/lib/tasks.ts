// ===== 任务系统逻辑 =====

import { getTasks as getTasksAPI, joinTask as joinTaskDB, completeTask as completeTaskDB, getUserTasks as getUserTasksDB, getCurrentUser } from './api/client'

export interface Task {
  id: string
  title: string
  description: string
  type: 'daily' | 'promote' | 'create' | 'challenge'
  category: string
  reward_points: number
  reward_type: string
  target_type?: string
  target_id?: string
  max_participants?: number
  current_participants: number
  start_date?: string
  end_date?: string
  status: string
  created_by?: string
  created_at: string
}

export interface TaskParticipant {
  id: string
  task_id: string
  user_id: string
  status: 'joined' | 'completed' | 'cancelled'
  progress: number
  completed_at?: string
  reward_claimed: boolean
  created_at: string
  tasks?: Task
}

/**
 * 获取任务列表
 */
export async function fetchTasks(type?: string): Promise<Task[]> {
  return getTasksAPI(type) as Promise<Task[]>
}

/**
 * 获取每日任务
 */
export async function fetchDailyTasks(): Promise<Task[]> {
  return fetchTasks('daily')
}

/**
 * 获取帮推任务
 */
export async function fetchPromoteTasks(): Promise<Task[]> {
  return fetchTasks('promote')
}

/**
 * 获取创作任务
 */
export async function fetchCreateTasks(): Promise<Task[]> {
  return fetchTasks('create')
}

/**
 * 参与任务
 */
export async function joinTaskById(taskId: string, userId: string) {
  return joinTaskDB(taskId, userId)
}

/**
 * 完成任务
 */
export async function completeTaskById(taskId: string, userId: string) {
  return completeTaskDB(taskId, userId)
}

/**
 * 获取用户参与的任务
 */
export async function fetchUserTasks(userId: string): Promise<TaskParticipant[]> {
  return getUserTasksDB(userId)
}

/**
 * 检查用户是否已参与任务
 */
export async function isTaskJoined(taskId: string, userId: string): Promise<boolean> {
  try {
    const userTasks = await getUserTasksDB(userId)
    return (userTasks || []).some((t: any) => t.task_id === taskId)
  } catch {
    return false
  }
}

/**
 * 自动检测任务完成状态
 */
export async function autoCheckTaskCompletion(userId: string) {
  try {
    // 获取用户参与的任务
    const userTasks = await getUserTasksDB(userId)
    const joinedTasks = (userTasks || []).filter((t: any) => t.status === 'joined')

    if (!joinedTasks.length) return

    const completed: string[] = []

    for (const participant of joinedTasks) {
      const task = participant.tasks as unknown as Task
      if (!task) continue

      let isComplete = false

      // 简化判断：使用签到 API 检查签到类任务
      // 其他任务类型的完成判断需要后端提供 /api/users/:id/stats 接口
      if (task.type === 'daily' && task.title?.includes('签到')) {
        try {
          const { getTodaySignIn } = await import('./api/client')
          isComplete = await getTodaySignIn()
        } catch {
          isComplete = false
        }
      }
      // TODO: 其他任务类型的自动完成检测需要后端提供统计数据接口

      if (isComplete) {
        await completeTaskById(task.id, userId)
        completed.push(task.id)
      }
    }

    return completed
  } catch {
    return []
  }
}

/**
 * 创建任务（管理员/达人功能）
 * TODO: 需要后端提供 POST /api/tasks 接口（admin 权限）
 */
export async function createTask(task: {
  title: string
  description: string
  type: string
  reward_points: number
  end_date?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // TODO: 后端需要提供创建任务的 API
  // const data = await createTaskAPI({ ...task, category: 'user', created_by: user.id })
  // return data
  throw new Error('创建任务功能需要后端 POST /api/tasks 接口支持')
}

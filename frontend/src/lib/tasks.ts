// ===== 任务系统逻辑 =====

import { supabase, joinTask as joinTaskDB, completeTask as completeTaskDB, getUserTasks as getUserTasksDB } from './supabase/client'

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
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
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
  const { data } = await supabase
    .from('task_participants')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .single()

  return !!data
}

/**
 * 自动检测任务完成状态
 */
export async function autoCheckTaskCompletion(userId: string) {
  // 获取用户参与的未完成任务
  const { data: joinedTasks } = await supabase
    .from('task_participants')
    .select('*, tasks(*)')
    .eq('user_id', userId)
    .eq('status', 'joined')

  if (!joinedTasks) return

  const completed: string[] = []

  for (const participant of joinedTasks) {
    const task = participant.tasks as unknown as Task
    if (!task) continue

    let isComplete = false

    switch (task.type) {
      case 'daily': {
        // 检查每日任务完成情况
        if (task.title.includes('签到')) {
          const today = new Date().toISOString().split('T')[0]
          const { data: signIn } = await supabase
            .from('sign_ins')
            .select('id')
            .eq('user_id', userId)
            .eq('sign_date', today)
            .single()
          isComplete = !!signIn
        } else if (task.title.includes('发布')) {
          const { count } = await supabase
            .from('contents')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId)
          isComplete = (count || 0) >= 1
        } else if (task.title.includes('点赞')) {
          const { count } = await supabase
            .from('interactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', 'like')
          isComplete = (count || 0) >= 5
        } else if (task.title.includes('帮推')) {
          const { count } = await supabase
            .from('promotes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          isComplete = (count || 0) >= 1
        } else if (task.title.includes('评论')) {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          isComplete = (count || 0) >= 3
        }
        break
      }
      case 'promote': {
        const { count } = await supabase
          .from('promotes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        isComplete = (count || 0) >= 1
        break
      }
      case 'create': {
        const { count } = await supabase
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', userId)
        isComplete = (count || 0) >= 1
        break
      }
    }

    if (isComplete) {
      await completeTaskById(task.id, userId)
      completed.push(task.id)
    }
  }

  return completed
}

/**
 * 创建任务（管理员/达人功能）
 */
export async function createTask(task: {
  title: string
  description: string
  type: string
  reward_points: number
  end_date?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.from('tasks').insert({
    ...task,
    category: 'user',
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data
}

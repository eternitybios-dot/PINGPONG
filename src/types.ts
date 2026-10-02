export type Category = '基本' | '打ち方' | '回転・サーブ' | 'レシーブ・実戦'
export type LessonLevel = '基礎' | '発展'
export type PlayingHand = 'right' | 'left'
export type TrainingEnvironment = 'home' | 'solo' | 'partner'
export type TrainingPhase = 'warmup' | 'drill' | 'rest' | 'cooldown'

export interface LessonStep {
  label: string
  title: string
  detail: string
}

export interface Lesson {
  id: string
  title: string
  category: Category
  level: LessonLevel
  duration: number
  summary: string
  focus: string
  tips: [string, string, string]
  steps: [LessonStep, LessonStep, LessonStep, LessonStep]
  mistake: string
  better: string
  check: [string, string, string]
  drills: string[]
  tags: string[]
  visual: 'grip' | 'stance' | 'footwork' | 'forehand' | 'backhand' | 'drive' | 'push' | 'block' | 'serve' | 'spin' | 'knuckle' | 'receive' | 'course' | 'rally'
}

export interface Drill {
  id: string
  title: string
  level: LessonLevel
  duration: number
  environment: TrainingEnvironment[]
  equipment: string[]
  summary: string
  cue: string
  steps: [string, string, string]
  target: string
  metric: string
  easier: string
  harder: string
  lessons: string[]
  diagram: 'solo' | 'rally' | 'serve' | 'route' | 'targets' | 'receive' | 'drive'
}

export interface PlanBlock {
  id: string
  phase: TrainingPhase
  title: string
  duration: number
  drillId?: string
  detail: string
  cue?: string
}

export interface WorkoutPlan {
  id: string
  title: string
  environment: TrainingEnvironment
  minutes: number
  level: LessonLevel
  goal: string
  blocks: PlanBlock[]
  reason: string
}

export interface SessionRecord {
  id: string
  planTitle: string
  goal: string
  environment: TrainingEnvironment
  startedAt: number
  finishedAt: number
  plannedSeconds: number
  activeSeconds: number
  completedDrillIds: string[]
  skippedDrillIds: string[]
  difficulty: 'easy' | 'just-right' | 'hard'
  note: string
  achievements: Record<string, number>
}

export interface ActiveSession {
  id: string
  plan: WorkoutPlan
  startedAt: number
  currentIndex: number
  blockElapsedSeconds: number
  blockStartedAt: number | null
  status: 'running' | 'paused' | 'review'
  completedIndices: number[]
  skippedIndices: number[]
  achievements: Record<string, number>
}

export interface UserProfile {
  hand: PlayingHand
  level: LessonLevel
  goal: string
  environment: TrainingEnvironment
  hasRacket: boolean
  hasBall: boolean
}

export interface AppState {
  profile: UserProfile
  favoriteLessons: string[]
  favoriteDrills: string[]
  seenLessons: string[]
  sessions: SessionRecord[]
  activeSession: ActiveSession | null
}

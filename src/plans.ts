import { DRILLS, drillById, lessonById, GOALS } from './content'
import type { ActiveSession, PlanBlock, TrainingEnvironment, UserProfile, WorkoutPlan } from './types'

interface SeedBlock {
  phase: PlanBlock['phase']
  duration: number
  drill?: string
  detail: string
}

const seeds: Record<string, { title: string; environment: TrainingEnvironment; minutes: number; level: WorkoutPlan['level']; goal: string; blocks: SeedBlock[] }> = {
  P01: { title: 'おうちで基本の構え', environment: 'home', minutes: 15, level: '基礎', goal: 'フットワーク', blocks: [
    { phase: 'warmup', duration: 2, detail: '周りの安全を見て、肩と足を軽く動かす。' }, { phase: 'drill', duration: 3, drill: 'D02', detail: 'フォアの準備から戻りまで、ゆっくり反復する。' }, { phase: 'drill', duration: 3, drill: 'D03', detail: 'バック側の打点を体の前に作る。' }, { phase: 'drill', duration: 4, drill: 'D04', detail: '左右へ小さく動いて構えに戻る。' }, { phase: 'rest', duration: 1, detail: '水を飲み、足元を確認する。' }, { phase: 'cooldown', duration: 2, detail: '肩と呼吸を落ち着け、できたことを振り返る。' },
  ] },
  P02: { title: 'おうちで30分フットワーク', environment: 'home', minutes: 30, level: '基礎', goal: 'フットワーク', blocks: [
    { phase: 'warmup', duration: 3, detail: '足元と周囲を確認し、軽く体を動かす。' }, { phase: 'drill', duration: 3, drill: 'D01', detail: 'ボールを小さく弾ませて面を確かめる。' }, { phase: 'drill', duration: 3, drill: 'D02', detail: 'フォアの動きを構えから戻りまで繰り返す。' }, { phase: 'drill', duration: 3, drill: 'D03', detail: 'バックの打点を体の前に作る。' }, { phase: 'drill', duration: 4, drill: 'D04', detail: '左右へ動いて構え直す。' }, { phase: 'drill', duration: 4, drill: 'D05', detail: '打球後に中央へ戻る動きを確かめる。' }, { phase: 'drill', duration: 2, drill: 'D06', detail: '握りとラケット面を確かめる。' }, { phase: 'rest', duration: 5, detail: '種目の間に球拾いと水分補給をする。' }, { phase: 'cooldown', duration: 3, detail: '呼吸を整え、次の課題を一つ選ぶ。' },
  ] },
  P03: { title: 'サーブをじっくり練習', environment: 'solo', minutes: 15, level: '基礎', goal: 'サーブ', blocks: [
    { phase: 'warmup', duration: 2, detail: '周囲とラケットを確かめ、軽く体をほぐす。' }, { phase: 'drill', duration: 5, drill: 'D15', detail: 'トスと下回転を意識して練習する。' }, { phase: 'drill', duration: 5, drill: 'D17', detail: '短く相手側で二度弾む長さを目指す。' }, { phase: 'rest', duration: 1, detail: 'ボールを拾って水を飲む。' }, { phase: 'cooldown', duration: 2, detail: '合法なサーブと目標の長さを振り返る。' },
  ] },
  P04: { title: 'ひとりでサーブを使い分ける', environment: 'solo', minutes: 30, level: '基礎', goal: 'サーブ', blocks: [
    { phase: 'warmup', duration: 3, detail: '足元と用具を確認し、肩を動かす。' }, { phase: 'drill', duration: 5, drill: 'D15', detail: '下回転の接触を確かめる。' }, { phase: 'drill', duration: 5, drill: 'D16', detail: '接触を変えて同じ長さへ出す。' }, { phase: 'rest', duration: 2, detail: '球を拾って、力を抜く。' }, { phase: 'drill', duration: 5, drill: 'D17', detail: '相手側で二度弾む短さを狙う。' }, { phase: 'drill', duration: 5, drill: 'D18', detail: '同じフォームから深いコースを狙う。' }, { phase: 'rest', duration: 2, detail: 'ボールを拾い、長さの違いを確認する。' }, { phase: 'cooldown', duration: 3, detail: '違いを感じたサーブを一つ記録する。' },
  ] },
  P05: { title: 'サーブを繰り返して定着', environment: 'solo', minutes: 60, level: '基礎', goal: 'サーブ', blocks: [
    { phase: 'warmup', duration: 5, detail: '周囲と用具を確認し、肩・肘を無理なく動かす。' }, { phase: 'drill', duration: 5, drill: 'D15', detail: '下回転サーブの接触を確かめる。' }, { phase: 'rest', duration: 2, detail: '球拾いをしながら、狙いを確認する。' }, { phase: 'drill', duration: 5, drill: 'D16', detail: '回転を少なくした接触を比べる。' }, { phase: 'rest', duration: 2, detail: '肩の力を抜いて、水を飲む。' }, { phase: 'drill', duration: 5, drill: 'D17', detail: '短いサーブの長さをそろえる。' }, { phase: 'rest', duration: 2, detail: 'ボールを拾い、同じトスを準備する。' }, { phase: 'drill', duration: 5, drill: 'D18', detail: '相手コートの深い範囲を狙う。' }, { phase: 'rest', duration: 2, detail: '長さの違いを確認する。' }, { phase: 'drill', duration: 5, drill: 'D15', detail: '下回転の接触をもう一度確かめる。' }, { phase: 'rest', duration: 2, detail: '球を拾い、疲れがないか確かめる。' }, { phase: 'drill', duration: 5, drill: 'D17', detail: '短いサーブを狙う。' }, { phase: 'rest', duration: 2, detail: '水分補給をする。' }, { phase: 'drill', duration: 5, drill: 'D18', detail: '深いサーブをもう一度狙う。' }, { phase: 'rest', duration: 1, detail: '力が入っていないか振り返る。' }, { phase: 'cooldown', duration: 5, detail: 'サーブの長さと疲れを記録する。' },
  ] },
  P06: { title: 'ペアでフォア・バックラリー', environment: 'partner', minutes: 15, level: '基礎', goal: 'ラリーを安定', blocks: [
    { phase: 'warmup', duration: 2, detail: 'お互いに球の速さを確認する。' }, { phase: 'drill', duration: 5, drill: 'D07', detail: 'フォア側のクロスで連続ラリーをする。' }, { phase: 'rest', duration: 1, detail: '交代して水分補給をする。' }, { phase: 'drill', duration: 5, drill: 'D08', detail: 'バック側で同じ速さを続ける。' }, { phase: 'cooldown', duration: 2, detail: '続いた球数を振り返る。' },
  ] },
  P07: { title: 'ペアでラリーを動かす', environment: 'partner', minutes: 30, level: '基礎', goal: 'ラリーを安定', blocks: [
    { phase: 'warmup', duration: 3, detail: 'ラケットと台の周りを確認する。' }, { phase: 'drill', duration: 5, drill: 'D07', detail: 'フォアで続けやすい速さを探す。' }, { phase: 'rest', duration: 1, detail: '球拾いをして交代する。' }, { phase: 'drill', duration: 5, drill: 'D08', detail: 'バックの面と打点を確認する。' }, { phase: 'rest', duration: 1, detail: '一息入れて立ち位置を確かめる。' }, { phase: 'drill', duration: 6, drill: 'D09', detail: 'フォア・バックへ小さく動く。' }, { phase: 'rest', duration: 1, detail: '交代して水分補給をする。' }, { phase: 'drill', duration: 6, drill: 'D23', detail: '相手の上回転を小さくブロックする。' }, { phase: 'cooldown', duration: 2, detail: '続いた球数と動きやすさを振り返る。' },
  ] },
  P08: { title: 'ペアでサーブから3球目へ', environment: 'partner', minutes: 60, level: '発展', goal: '試合の組み立て', blocks: [
    { phase: 'warmup', duration: 5, detail: '安全と用具を確認し、相手と球の種類を決める。' }, { phase: 'drill', duration: 5, drill: 'D07', detail: 'ウォームアップを兼ねてフォアを続ける。' }, { phase: 'rest', duration: 1, detail: '球を拾って水分補給をする。' }, { phase: 'drill', duration: 5, drill: 'D08', detail: 'バック側のラリーを続ける。' }, { phase: 'rest', duration: 1, detail: '役割を入れ替える。' }, { phase: 'drill', duration: 5, drill: 'D13', detail: 'フォアツッツキで下回転を返す。' }, { phase: 'rest', duration: 2, detail: '球を拾い、肩の力を抜く。' }, { phase: 'drill', duration: 5, drill: 'D14', detail: 'バックツッツキで長さを合わせる。' }, { phase: 'rest', duration: 1, detail: '一息入れて立ち位置を整える。' }, { phase: 'drill', duration: 7, drill: 'D21', detail: 'フォアドライブの安定を練習する。' }, { phase: 'rest', duration: 2, detail: '水分補給をして球を拾う。' }, { phase: 'drill', duration: 6, drill: 'D19', detail: '下回転サーブを見てレシーブする。' }, { phase: 'rest', duration: 2, detail: '相手と役割を入れ替える。' }, { phase: 'drill', duration: 8, drill: 'D24', detail: 'サーブから3球目への動きをつなげる。' }, { phase: 'cooldown', duration: 5, detail: '二人で目標と次の課題を振り返る。' },
  ] },
}

const focusByGoal: Record<string, string[]> = {
  'ラリーを安定': ['T04', 'T05', 'T10'], サーブ: ['T11', 'T12', 'T13'],
  '回転・レシーブ': ['T08', 'T09', 'T14'], フットワーク: ['T02', 'T03', 'T15'],
  '試合の組み立て': ['T14', 'T15', 'T16'],
}

export function buildPlan(profile: UserProfile, environment: TrainingEnvironment, minutes: number, requestedGoal = profile.goal): WorkoutPlan | null {
  const id = Object.entries(seeds).find(([, seed]) => seed.environment === environment && seed.minutes === minutes)?.[0]
  if (!id) return null
  const seed = seeds[id]
  const beginnerSwap = id === 'P08' && profile.level === '基礎'
  let stages = seed.blocks.map((block) => ({ ...block }))
  let restAdjustment = 0

  if (beginnerSwap) {
    stages = stages.map((block) => {
      if (block.drill === 'D21') { restAdjustment += 2; return { ...block, drill: 'D10', duration: 5, detail: '広いクロスの目標へ安定して返す。' } }
      if (block.drill === 'D24') { restAdjustment += 2; return { ...block, drill: 'D09', duration: 6, detail: 'フォア・バックに合わせて小さく動く。' } }
      return block
    })
  }

  const unavailable = stages.some((block) => {
    const drill = block.drill ? drillById(block.drill) : undefined
    if (!drill) return false
    if (drill.equipment.includes('ラケット') && !profile.hasRacket) return true
    return drill.equipment.includes('球') && !profile.hasBall
  })
  const noHomeEquipment = environment === 'home' && unavailable
  if (noHomeEquipment) {
    restAdjustment = -2
    stages = stages.map((block) => {
      if (block.drill === 'D01') return { ...block, drill: 'D02', detail: 'ラケットなしで構えからフォアの動きを練習する。' }
      if (block.drill === 'D06') return { ...block, drill: 'D05', detail: '球なしで打球後の構え直しを確かめる。' }
      if (block.phase === 'rest' && restAdjustment < 0) {
        const reduction = Math.abs(restAdjustment)
        restAdjustment = 0
        return { ...block, duration: Math.max(1, block.duration - reduction) }
      }
      return block
    })
  }

  const hasMissingTableEquipment = environment !== 'home' && stages.some((block) => {
    const drill = block.drill ? drillById(block.drill) : undefined
    return drill?.equipment.includes('ラケット') && !profile.hasRacket || drill?.equipment.includes('球') && !profile.hasBall
  })

  const blocks: PlanBlock[] = stages.filter((block) => block.duration > 0).map((block, index) => {
    const drill = block.drill ? drillById(block.drill) : undefined
    const displayName = block.phase === 'warmup' ? 'ウォームアップ' : block.phase === 'cooldown' ? '整理運動・振り返り' : block.phase === 'rest' ? '休憩・水分補給' : drill?.title ?? '基本の動き'
    return {
      id: `${id}-${index}-${block.drill ?? block.phase}`,
      phase: block.phase,
      duration: block.duration * 60,
      drillId: block.drill,
      title: displayName,
      detail: block.detail,
      cue: drill?.cue,
    }
  })

  const goalLessons = (focusByGoal[requestedGoal] ?? focusByGoal['ラリーを安定']).map((lessonId) => lessonById(lessonId)?.title).filter((title): title is string => Boolean(title))
  const onGoal = seed.goal === requestedGoal
  return {
    id,
    title: onGoal ? seed.title : `${seed.title} · ${requestedGoal}`,
    environment,
    minutes,
    level: seed.level,
    goal: requestedGoal || GOALS[0],
    blocks,
    reason: hasMissingTableEquipment ? 'ラケットと球を用意できる設定にすると、このメニューを始められます。' : onGoal ? 'いつもの環境と時間に合わせた基本メニューです。' : `${requestedGoal}を意識しながら、${goalLessons.slice(0, 2).join('・')}のコツを取り入れて練習します。`,
  }
}

export function suggestedLessons(goal: string, favorites: string[]) {
  const priority = focusByGoal[goal] ?? focusByGoal['ラリーを安定']
  return Array.from(new Set([...priority, ...favorites])).slice(0, 3)
}

export const getPlanDrills = (plan: WorkoutPlan) => plan.blocks.filter((block) => block.phase === 'drill' && block.drillId).map((block) => DRILLS.find((drill) => drill.id === block.drillId)).filter((drill): drill is (typeof DRILLS)[number] => Boolean(drill))

export function startWorkout(plan: WorkoutPlan): ActiveSession {
  return {
    id: crypto.randomUUID(),
    plan,
    startedAt: Date.now(),
    currentIndex: 0,
    blockElapsedSeconds: 0,
    blockStartedAt: Date.now(),
    status: 'running',
    completedIndices: [],
    skippedIndices: [],
    achievements: {},
  }
}

export function getSessionElapsed(session: ActiveSession, now = Date.now()): number {
  const finishedSeconds = session.plan.blocks.reduce((total, block, index) => {
    if (index === session.currentIndex) return total
    if (session.completedIndices.includes(index)) return total + block.duration
    const activeAtIndex = index < session.currentIndex && !session.skippedIndices.includes(index)
    return activeAtIndex ? total + block.duration : total
  }, 0)
  const currentElapsed = session.status === 'running' && session.blockStartedAt
    ? Math.min(session.plan.blocks[session.currentIndex]?.duration ?? 0, Math.floor((now - session.blockStartedAt) / 1000))
    : session.blockElapsedSeconds
  return finishedSeconds + Math.max(0, currentElapsed)
}

export function planDurationMatches(plan: WorkoutPlan): boolean {
  return plan.blocks.reduce((sum, block) => sum + block.duration, 0) === plan.minutes * 60
}

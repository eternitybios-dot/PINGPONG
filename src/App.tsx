import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowRight, Award, BadgeCheck, BookOpen, Bookmark, Edit3,
  Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, CloudOff, Compass, Dumbbell,
  Flame, House, Info, Lightbulb, ListChecks, LoaderCircle, Maximize, Pause, Play, Plus,
  RotateCcw, Search, Settings, ShieldCheck, SkipForward, Sparkles, Target, Trophy, Users, Wifi, X,
} from 'lucide-react'
import { DRILLS, ENVIRONMENT_NAMES, ENVIRONMENT_SHORT, GOALS, LESSONS, LESSON_CATEGORIES, LEVEL_NAMES, drillById, lessonById, searchContent } from './content'
import { Illustration, HeroTableArt } from './Illustrations'
import { buildPlan, getSessionElapsed } from './plans'
import { applyUpdate, installPwa, prepareOfflineNow, startPwa, type PwaState } from './pwa'
import { claimSessionLock, getLiveSessionLock, readState, refreshSessionLock, releaseSessionLock, saveState, TAB_ID } from './storage'
import type { ActiveSession, AppState, Drill, Lesson, PlanBlock, SessionRecord, TrainingEnvironment, UserProfile, WorkoutPlan } from './types'

type Screen = { page: string; id?: string }

function routeFromHash(): Screen {
  const path = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  const [rawPage, id] = path.split('/')
  const page = rawPage || 'home'
  return { page, id }
}

function go(path: string) {
  const next = `#/${path.replace(/^\//, '')}`
  if (window.location.hash === next) window.dispatchEvent(new HashChangeEvent('hashchange'))
  else window.location.hash = next
}

const INITIAL: AppState = {
  profile: { hand: 'right', level: '基礎', goal: 'ラリーを安定', environment: 'home', hasRacket: false, hasBall: false },
  favoriteLessons: [], favoriteDrills: [], seenLessons: [], sessions: [], activeSession: null,
}

const navigation = [
  { page: 'home', label: 'ホーム', icon: House },
  { page: 'learn', label: '学ぶ', icon: BookOpen },
  { page: 'practice', label: '練習', icon: Dumbbell },
  { page: 'history', label: '記録', icon: Activity },
]

function useAppRoute() {
  const [route, setRoute] = useState<Screen>(routeFromHash)
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', '#/home')
    const sync = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])
  return [route, go] as const
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function formatDate(date: number, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('ja-JP', options).format(new Date(date))
}

function lessonDestination(id: string) { go(`lesson/${id}`) }
function drillDestination(id: string) { go(`drill/${id}`) }

function MondayKey(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - day)
  return `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
}

function toGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'おはようございます'
  if (hour < 17) return 'こんにちは'
  return 'こんばんは'
}

function SmallButton({ children, onClick, className = '', ariaLabel, disabled = false, title }: { children: React.ReactNode; onClick: () => void; className?: string; ariaLabel?: string; disabled?: boolean; title?: string }) {
  return <button type="button" className={`icon-button ${className}`} title={title} aria-label={ariaLabel} onClick={onClick} disabled={disabled}>{children}</button>
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand" type="button" onClick={onClick} aria-label="PINGPONGホームへ">
      <span className="brand__mark"><img src={`${import.meta.env.BASE_URL}pingpong.svg`} alt="" /></span>
      <span className="brand__text">PINGPONG<span>practice, little by little</span></span>
    </button>
  )
}

function OfflinePill({ pwa, onOpen }: { pwa: PwaState; onOpen: () => void }) {
  const Icon = pwa.offline === 'ready' ? Wifi : pwa.offline === 'offline' ? CloudOff : pwa.offline === 'preparing' ? LoaderCircle : pwa.offline === 'error' ? CloudOff : Wifi
  const label = !navigator.onLine ? (pwa.offline === 'ready' ? 'オフライン利用中' : '通信なし') : pwa.offline === 'ready' ? 'オフライン準備OK' : pwa.offline === 'preparing' ? '保存中' : pwa.offline === 'error' ? '保存を確認' : '準備しています'
  return <button type="button" className={`offline-pill offline-pill--${pwa.offline}`} onClick={onOpen}><Icon size={14} className={pwa.offline === 'preparing' ? 'spin-icon' : ''} />{label}</button>
}

function Sidebar({ active, open }: { active: string; open: (page: string) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__top"><Brand onClick={() => open('home')} /></div>
      <span className="sidebar__label">MENU</span>
      <nav className="sidebar__nav" aria-label="メインメニュー">
        {navigation.map((item) => <button key={item.page} type="button" className={`nav-item ${active === item.page ? 'nav-item--active' : ''}`} onClick={() => open(item.page)}><item.icon size={19} strokeWidth={1.85} /><span>{item.label}</span>{active === item.page && <span className="nav-item__dot" />}</button>)}
      </nav>
      <div className="sidebar__spacer" />
      <div className="sidebar__tip"><div className="sidebar__tip-icon"><Lightbulb size={18} /></div><div><b>焦らず、1球ずつ。</b><span>今日は少しだけでも<br />続けた自分に、まる。</span></div></div>
      <button type="button" className="nav-item nav-item--settings" onClick={() => open('settings')}><Settings size={19} /><span>設定</span></button>
      <div className="sidebar__foot">楽しく、続けるために。</div>
    </aside>
  )
}

function Topbar({ route, state, pwa, open, onInstall }: { route: Screen; state: AppState; pwa: PwaState; open: (page: string) => void; onInstall: () => void }) {
  const currentTitle = navigation.find((item) => item.page === route.page)?.label
    ?? (route.page === 'lesson' ? 'フォームを学ぶ' : route.page === 'drill' ? '練習メニュー' : route.page === 'settings' ? '設定' : route.page === 'install' ? 'ホーム画面に追加' : route.page === 'run' || route.page === 'review' ? '今日の練習' : '練習記録')
  const profileName = state.profile.hand === 'left' ? '左利き' : '右利き'
  return (
    <header className="topbar">
      <div className="topbar__left"><button type="button" className="topbar__menu" onClick={() => open('home')} aria-label="ホーム"><span /><span /><span /></button><span className="topbar__crumb">{currentTitle}</span></div>
      <div className="topbar__right"><OfflinePill pwa={pwa} onOpen={() => open('install')} /><button type="button" className="profile-pill" onClick={() => open('settings')}><span className="profile-pill__avatar"><span>🏓</span></span><span className="profile-pill__name">{profileName}</span><ChevronDown size={14} /></button><button type="button" className="install-top" onClick={onInstall}>アプリを追加</button></div>
    </header>
  )
}

function NavBottom({ active, open }: { active: string; open: (page: string) => void }) {
  return <nav className="bottom-nav" aria-label="メインメニュー">{navigation.map((item) => <button key={item.page} type="button" onClick={() => open(item.page)} className={active === item.page ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'} aria-current={active === item.page ? 'page' : undefined}><item.icon size={20} /><span>{item.label}</span></button>)}</nav>
}

function LessonCard({ lesson, state, setState, compact = false, onDiagram }: { lesson: Lesson; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; compact?: boolean; onDiagram?: () => void }) {
  const saved = state.favoriteLessons.includes(lesson.id)
  return (
    <article className={`lesson-card ${compact ? 'lesson-card--compact' : ''}`}>
      <button type="button" className="lesson-card__visual" onClick={onDiagram} aria-label={`${lesson.title}のイラストを拡大`}><Illustration lesson={lesson} hand={state.profile.hand} compact /></button>
      <div className="lesson-card__body">
        <div className="lesson-card__topline"><span className={`level-chip ${lesson.level === '発展' ? 'level-chip--advanced' : ''}`}>{LEVEL_NAMES[lesson.level]}</span><SmallButton className={saved ? 'icon-button--saved' : ''} onClick={() => setState((current) => ({ ...current, favoriteLessons: saved ? current.favoriteLessons.filter((id) => id !== lesson.id) : [...current.favoriteLessons, lesson.id] }))} ariaLabel={saved ? 'お気に入りを解除' : 'お気に入りに追加'}>{saved ? <Bookmark size={17} fill="currentColor" /> : <Bookmark size={17} />}</SmallButton></div>
        <button type="button" className="lesson-card__title" onClick={() => lessonDestination(lesson.id)}>{lesson.title}</button>
        <p>{lesson.summary}</p>
        <div className="lesson-card__footer"><span>{lesson.category}</span><button type="button" onClick={() => lessonDestination(lesson.id)}>学ぶ <ArrowRight size={14} /></button></div>
      </div>
    </article>
  )
}

function DrillCard({ drill, state, setState, full = false }: { drill: Drill; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; full?: boolean }) {
  const saved = state.favoriteDrills.includes(drill.id)
  const required = drill.equipment.filter((item) => ['ラケット', '球'].includes(item))
  const EnvironmentIcon = drill.environment.includes('partner') ? Users : drill.environment.includes('solo') ? Activity : House
  return (
    <article className={`drill-card ${full ? 'drill-card--full' : ''}`}>
      <button type="button" className="drill-card__art" onClick={() => drillDestination(drill.id)} aria-label={`${drill.title}の練習図を開く`}><Illustration drill={drill} hand={state.profile.hand} kind="layout" compact /></button>
      <div className="drill-card__content">
        <div className="drill-card__tags"><span className={`level-chip ${drill.level === '発展' ? 'level-chip--advanced' : ''}`}>{LEVEL_NAMES[drill.level]}</span><span className="micro-tag"><EnvironmentIcon size={12} />{drill.environment.includes('partner') ? '相手あり' : drill.environment.includes('solo') ? '台・ひとり' : '台なし'}</span></div>
        <button type="button" className="drill-card__title" onClick={() => drillDestination(drill.id)}>{drill.title}</button>
        <p>{drill.summary}</p>
        <div className="drill-card__footer"><span className="time-label"><Clock3 size={14} />約{drill.duration}分{required.length ? ` · ${required.join('・')}` : ''}</span><button type="button" onClick={() => drillDestination(drill.id)}>内容を見る <ArrowRight size={14} /></button></div>
      </div>
      <SmallButton className={`drill-card__save ${saved ? 'icon-button--saved' : ''}`} onClick={() => setState((current) => ({ ...current, favoriteDrills: saved ? current.favoriteDrills.filter((id) => id !== drill.id) : [...current.favoriteDrills, drill.id] }))} ariaLabel={saved ? 'お気に入り解除' : 'お気に入りに追加'}>{saved ? <Bookmark size={16} fill="currentColor" /> : <Bookmark size={16} />}</SmallButton>
    </article>
  )
}

function SectionHeading({ eyebrow, title, detail, action, onAction }: { eyebrow?: string; title: string; detail?: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action && onAction && <button type="button" className="text-action" onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div>
}

function EmptyState({ icon: Icon, title, detail, action, onAction }: { icon: typeof BookOpen; title: string; detail: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-state__icon"><Icon size={24} /></span><b>{title}</b><p>{detail}</p>{action && onAction && <button type="button" className="button button--soft" onClick={onAction}>{action}<ArrowRight size={16} /></button>}</div>
}

function HomeScreen({ state, setState, open, onDiagram }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void; onDiagram: (lesson: Lesson) => void }) {
  const thisWeek = state.sessions.filter((session) => MondayKey(new Date(session.finishedAt)) === MondayKey())
  const weekSeconds = thisWeek.reduce((sum, session) => sum + session.activeSeconds, 0)
  const drillsDone = thisWeek.reduce((sum, session) => sum + session.completedDrillIds.length, 0)
  const clockDays = ['月', '火', '水', '木', '金', '土', '日'].map((label, index) => {
    const today = new Date()
    const mondayOffset = (today.getDay() + 6) % 7
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + index)
    const minutes = state.sessions.filter((session) => new Date(session.finishedAt).toDateString() === day.toDateString()).reduce((sum, session) => sum + session.activeSeconds, 0) / 60
    return { label, minutes, today: day.toDateString() === today.toDateString() }
  })
  const favourite = state.favoriteLessons.map((id) => lessonById(id)).filter((lesson): lesson is Lesson => Boolean(lesson)).slice(0, 3)
  const starterIds = state.profile.goal === 'サーブ' ? ['T11', 'T12', 'T14'] : state.profile.goal === 'フットワーク' ? ['T02', 'T03', 'T04'] : state.profile.goal === '回転・レシーブ' ? ['T08', 'T09', 'T14'] : state.profile.goal === '試合の組み立て' ? ['T14', 'T15', 'T16'] : ['T02', 'T04', 'T05']
  const quickLessons = (favourite.length ? favourite : starterIds.map(lessonById).filter((item): item is Lesson => Boolean(item))).slice(0, 3)
  const environmentLabel = ENVIRONMENT_NAMES[state.profile.environment]
  const currentPlan = buildPlan(state.profile, state.profile.environment, state.profile.environment === 'home' ? 15 : 15, state.profile.goal)
  const newLesson = LESSONS.find((lesson) => !state.seenLessons.includes(lesson.id)) ?? LESSONS[0]
  const workout = (plan: WorkoutPlan | null) => {
    if (!plan) { open('practice'); return }
    go(`plan/${plan.id}-${plan.environment}-${plan.minutes}`)
  }
  return (
    <div className="home-page page-enter">
      <section className="hero-card">
        <div className="hero-card__copy"><div className="hero-card__greeting"><span className="hero-card__dot" />{toGreeting()} · PINGPONG練習ノート</div><h1>つづけることが、<br /><span>いちばんの近道。</span></h1><p>フォームをひとつ覚えて、今日できる練習から。<br />あなたのペースで、卓球をもっと好きになろう。</p><div className="hero-card__actions"><button type="button" className="button button--sun" onClick={() => open('practice')}>練習を選ぶ <ArrowRight size={17} /></button><span className="hero-card__env"><Activity size={14} />{environmentLabel}</span></div></div>
        <div className="hero-card__art"><HeroTableArt /><div className="hero-card__floating"><span>今日のコツ</span><b>体の前で、<br />やさしく打つ。</b><span className="hero-card__ball">●</span></div><div className="hero-card__caption">小さな一球が、つぎにつながる。</div></div>
        <div className="hero-card__sun" />
      </section>

      <div className="home-stats">
        <div className="stat-card"><span className="stat-card__icon stat-card__icon--green"><Clock3 size={19} /></span><div><span>今週の練習時間</span><b>{Math.floor(weekSeconds / 60)}<small> 分</small></b></div><span className="stat-card__foot">記録した時間</span></div>
        <div className="stat-card"><span className="stat-card__icon stat-card__icon--peach"><Dumbbell size={18} /></span><div><span>練習できた種目</span><b>{drillsDone}<small> 種目</small></b></div><span className="stat-card__foot">少しずつ増えていく</span></div>
        <div className="stat-card"><span className="stat-card__icon stat-card__icon--yellow"><BookOpen size={18} /></span><div><span>読んだフォーム</span><b>{state.seenLessons.length}<small> / 16</small></b></div><span className="stat-card__foot">図でひとつずつ</span></div>
      </div>

      <div className="home-main-grid">
        <section className="panel week-panel">
          <div className="panel__top"><div><span className="eyebrow">THIS WEEK</span><h2>今週のリズム</h2></div><button type="button" className="week-count" onClick={() => open('history')}><span className="week-count__spark">✳</span>練習日 <b>{new Set(thisWeek.map((session) => new Date(session.finishedAt).toDateString())).size}</b></button></div>
          <div className="week-chart" aria-label="曜日ごとの練習時間">{clockDays.map((day) => <div key={day.label} className={`week-chart__day ${day.today ? 'week-chart__day--today' : ''}`}><div className="week-chart__bar-wrap"><div className="week-chart__bar" style={{ height: `${Math.max(day.minutes ? Math.min(72, day.minutes * 2.2) : 5, 5)}px` }} /><div className="week-chart__bar-dot" /></div><span>{day.label}</span></div>)}</div>
          <div className="week-panel__footer"><span>今週も、自分のペースで。</span><button type="button" onClick={() => open('history')}>記録を見る <ArrowRight size={14} /></button></div>
        </section>
        <section className="next-card"><div className="next-card__top"><span className="eyebrow">TODAY'S PRACTICE</span><span className="next-card__spark"><Sparkles size={17} /></span></div><div className="next-card__illustration"><Illustration lesson={newLesson} hand={state.profile.hand} kind="overview" compact /></div><div className="next-card__content"><div className="next-card__pill"><span />次のおすすめ</div><h2>{currentPlan?.title ?? '基本の動きを練習しよう'}</h2><p>{newLesson.title}から始める、あなたのペースのメニュー。</p><div className="next-card__tags"><span><Clock3 size={13} />15分</span><span><House size={13} />{ENVIRONMENT_SHORT[state.profile.environment]}</span></div><button type="button" className="button button--forest" onClick={() => workout(currentPlan)}>メニューを見る <ArrowRight size={16} /></button></div></section>
      </div>

      <section className="home-lessons"><SectionHeading eyebrow="START HERE" title="今日のフォームのヒント" detail="動きを知ってから練習すると、上達のきっかけが見つかる。" action="すべて学ぶ" onAction={() => open('learn')} /><div className="lesson-grid lesson-grid--three">{quickLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} state={state} setState={setState} onDiagram={() => onDiagram(lesson)} />)}</div></section>
      <div className="home-last-row"><div className="today-quote"><span>卓球のまめ知識 <span className="quote-flower">✳</span></span><p>いい練習は、<br /><b>小さな発見からはじまる。</b></p></div><button className="continuity-card" type="button" onClick={() => open('history')}><span className="continuity-card__icon"><RotateCcw size={17} /></span><span><b>{state.sessions.length ? '練習のつづきを振り返る' : 'あなたの記録がここに並びます'}</b><small>{state.sessions.length ? '前回のコツを次の練習につなげよう。' : '今日の練習を終えると、少しずつ増えていきます。'}</small></span><ArrowRight size={16} /></button></div>
    </div>
  )
}

function LearningScreen({ state, setState, onDiagram }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; onDiagram: (lesson: Lesson) => void }) {
  const [category, setCategory] = useState<string>('すべて')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites' | 'unread'>('all')
  const matches = searchContent(query, LESSONS) as Lesson[]
  const shown = matches.filter((lesson) => (category === 'すべて' || lesson.category === category)
    && (filter === 'all' || (filter === 'favorites' ? state.favoriteLessons.includes(lesson.id) : !state.seenLessons.includes(lesson.id))))
  return (
    <div className="page-shell page-enter">
      <div className="page-heading"><div><span className="eyebrow">ILLUSTRATED LESSONS</span><h1>フォームを、<span>見てわかる。</span></h1><p>むずかしい動きも、ひとつずつ図で整理しよう。</p></div><div className="page-heading__aside"><span className="lesson-count">{state.seenLessons.length}<small> / 16 学習済み</small></span><div className="progress-track"><span style={{ width: `${state.seenLessons.length / 16 * 100}%` }} /></div></div></div>
      <div className="library-controls"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="技術やコツを検索…" /><span>⌘ K</span></label><div className="filter-toggle" role="group" aria-label="教材を絞り込む"><button className={filter === 'all' ? 'filter-toggle__active' : ''} onClick={() => setFilter('all')}>すべて <small>16</small></button><button className={filter === 'favorites' ? 'filter-toggle__active' : ''} onClick={() => setFilter('favorites')}><Bookmark size={13} />お気に入り</button><button className={filter === 'unread' ? 'filter-toggle__active' : ''} onClick={() => setFilter('unread')}>未読 <small>{16 - state.seenLessons.length}</small></button></div></div>
      <div className="category-scroll">{LESSON_CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`category-chip ${category === item ? 'category-chip--selected' : ''}`}>{item}</button>)}</div>
      <div className="catalog-summary"><span>フォームを学ぶ <b>{shown.length}</b></span><span>図を押すと拡大できます <Maximize size={14} /></span></div>
      {shown.length ? <div className="lesson-grid">{shown.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} state={state} setState={setState} onDiagram={() => onDiagram(lesson)} />)}</div> : <EmptyState icon={filter === 'favorites' ? Bookmark : Search} title={filter === 'favorites' ? 'お気に入りはまだありません' : 'ぴったりの教材が見つかりませんでした'} detail={filter === 'favorites' ? '教材のしおりを押すと、ここに並びます。' : 'ちがう言葉やカテゴリで探してみましょう。'} action="すべて表示" onAction={() => { setCategory('すべて'); setFilter('all'); setQuery('') }} />}
    </div>
  )
}

function LessonScreen({ lesson, state, setState, open, onDiagram }: { lesson: Lesson; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void; onDiagram: (lesson: Lesson, kind?: 'overview' | 'sequence' | 'compare' | 'detail') => void }) {
  const [step, setStep] = useState(2)
  const saved = state.favoriteLessons.includes(lesson.id)
  const siblings = lesson.drills.map((id) => drillById(id)).filter((drill): drill is Drill => Boolean(drill))
  const nextLesson = LESSONS[(LESSONS.findIndex((item) => item.id === lesson.id) + 1) % LESSONS.length]
  useEffect(() => setState((current) => current.seenLessons.includes(lesson.id) ? current : ({ ...current, seenLessons: [...current.seenLessons, lesson.id] })), [lesson.id, setState])
  return (
    <div className="page-shell detail-page page-enter">
      <button type="button" className="back-link" onClick={() => go('learn')}><ArrowLeft size={16} />フォーム一覧</button>
      <div className="detail-heading"><div><div className="detail-heading__meta"><span className="level-chip">{LEVEL_NAMES[lesson.level]}</span><span>{lesson.id}</span><span>約{lesson.duration}分</span></div><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><SmallButton className={`detail-save ${saved ? 'icon-button--saved' : ''}`} onClick={() => setState((current) => ({ ...current, favoriteLessons: saved ? current.favoriteLessons.filter((id) => id !== lesson.id) : [...current.favoriteLessons, lesson.id] }))} ariaLabel={saved ? 'お気に入りを解除' : 'お気に入りに追加'}>{saved ? <Bookmark size={18} fill="currentColor" /> : <Bookmark size={18} />}</SmallButton></div>

      <section className="lesson-feature">
        <div className="lesson-feature__art" onClick={() => onDiagram(lesson, 'overview')} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onDiagram(lesson, 'overview')}><Illustration lesson={lesson} hand={state.profile.hand} kind="overview" /><span className="zoom-hint"><Maximize size={14} />図を大きく見る</span></div>
        <div className="lesson-feature__text"><div className="feature-kicker"><Lightbulb size={16} /> 今日のポイント</div><h2>{lesson.focus}</h2><ol className="key-points">{lesson.tips.map((tip, index) => <li key={tip}><span>0{index + 1}</span>{tip}</li>)}</ol><button type="button" className="button button--forest" onClick={() => onDiagram(lesson, 'sequence')}>動きを順番に見る <ArrowRight size={16} /></button></div>
      </section>

      <section className="lesson-steps-section"><SectionHeading eyebrow="FOUR SMALL STEPS" title="動きを4つに分けてみる" detail="番号を選ぶと、説明と図が切り替わります。" /><div className="lesson-step-layout"><div className="lesson-step-nav">{lesson.steps.map((item, index) => <button key={item.label} className={step === index ? 'lesson-step-nav__active' : ''} onClick={() => setStep(index)}><span>{item.label}</span><b>{item.title}</b><ChevronRight size={15} /></button>)}</div><button type="button" className="lesson-sequence-art" onClick={() => onDiagram(lesson, 'sequence')}><Illustration lesson={lesson} hand={state.profile.hand} kind="sequence" step={step} /><span className="zoom-hint"><Maximize size={14} />図を大きく見る</span></button></div><div className="step-copy"><span>{lesson.steps[step].label} / 4</span><b>{lesson.steps[step].title}</b><p>{lesson.steps[step].detail}</p><div className="step-copy__controls"><button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ChevronLeft size={15} />前へ</button><button onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>次へ<ChevronRight size={15} /></button></div></div></section>

      <div className="lesson-compare-grid"><section className="compare-card compare-card--wrong"><span className="compare-card__label"><span className="compare-dot compare-dot--bad" />気をつけたいこと</span><h3>{lesson.mistake}</h3></section><section className="compare-card compare-card--good"><span className="compare-card__label"><span className="compare-dot compare-dot--good" />こうするとやりやすい</span><h3>{lesson.better}</h3></section><button type="button" className="compare-card__art" onClick={() => onDiagram(lesson, 'compare')}><Illustration lesson={lesson} hand={state.profile.hand} kind="compare" compact /></button></div>

      <section className="detail-checks"><div><span className="eyebrow">SELF CHECK</span><h2>自分で確かめてみよう</h2></div>{lesson.check.map((item, index) => <div className="detail-check" key={item}><span>{index + 1}</span>{item}</div>)}</section>
      <section className="detail-tip-card"><Illustration lesson={lesson} hand={state.profile.hand} kind="detail" compact /><div><span className="eyebrow">ONE LAST TIP</span><h3>角度は球に合わせて。</h3><p>{lesson.focus}。球の高さや回転が変わったら、一球ごとにラケット面を確かめてみよう。</p></div></section>

      <section className="related-drills"><SectionHeading eyebrow="PRACTICE WHAT YOU LEARN" title="このフォームを練習する" detail="読んだコツを、短い練習で試してみよう。" />{siblings.length ? <div className="related-drills__row">{siblings.map((drill) => <button key={drill.id} type="button" className="related-drill" onClick={() => drillDestination(drill.id)}><span className="related-drill__number">{drill.id}</span><span><b>{drill.title}</b><small>{drill.summary}</small></span><span className="related-drill__time"><Clock3 size={14} />{drill.duration}分</span><ChevronRight size={17} /></button>)}</div> : <EmptyState icon={Dumbbell} title="練習メニューを準備中" detail="基本の練習一覧から、できそうな種目を探せます。" action="練習一覧へ" onAction={() => open('practice')} />}</section>
      <button type="button" className="next-lesson" onClick={() => lessonDestination(nextLesson.id)}><span><small>次のフォーム</small><b>{nextLesson.title}</b></span><span>次へ学ぶ <ArrowRight size={16} /></span></button>
    </div>
  )
}

function PracticeScreen({ state, setState, open, onConfirm }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void; onConfirm: (plan: WorkoutPlan) => void }) {
  const [environment, setEnvironment] = useState<TrainingEnvironment>(state.profile.environment)
  const [minutes, setMinutes] = useState(environment === 'home' ? 15 : 15)
  const [goal, setGoal] = useState(state.profile.goal)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'plan' | 'list' | 'favorites'>('plan')
  const [planEdits, setPlanEdits] = useState<Record<string, string>>({})
  useEffect(() => {
    setEnvironment(state.profile.environment)
    setGoal(state.profile.goal)
  }, [state.profile.environment, state.profile.goal])
  const basePlan = buildPlan(state.profile, environment, minutes, goal)
  const plan = basePlan ? { ...basePlan, blocks: basePlan.blocks.map((block) => {
    const drill = block.drillId ? drillById(planEdits[block.id] ?? block.drillId) : undefined
    return drill ? { ...block, drillId: drill.id, title: drill.title, detail: drill.summary, cue: drill.cue } : block
  }) } : null
  const visibleDrills = useMemo(() => (searchContent(query, DRILLS) as Drill[]).filter((drill) => drill.environment.includes(environment) && (state.profile.level === '発展' || drill.level === '基礎') && (tab !== 'favorites' || state.favoriteDrills.includes(drill.id))), [query, environment, tab, state.profile.level, state.favoriteDrills])
  const missingGear = plan?.blocks.filter((block) => block.drillId).flatMap((block) => drillById(block.drillId!)?.equipment ?? []).filter((item) => item === 'ラケット' && !state.profile.hasRacket || item === '球' && !state.profile.hasBall) ?? []
  const canStart = Boolean(plan && !missingGear.length)
  const setEnvironmentSafe = (next: TrainingEnvironment) => {
    setEnvironment(next)
    if (next === 'home' && minutes === 60) setMinutes(30)
  }
  const changeProfile = (patch: Partial<UserProfile>) => setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }))
  const runPlan = () => {
    if (!plan) return
    const gearCheck = plan.blocks.some((block) => {
      if (!block.drillId) return false
      const drill = drillById(block.drillId)
      return drill?.equipment.some((item) => item === 'ラケット' && !state.profile.hasRacket || item === '球' && !state.profile.hasBall)
    })
    if (!gearCheck) onConfirm(plan)
  }
  return (
    <div className="page-shell practice-page page-enter">
      <div className="page-heading"><div><span className="eyebrow">YOUR PRACTICE</span><h1>今日のメニューを、<span>つくろう。</span></h1><p>場所と時間を選ぶと、できる練習を組み合わせます。</p></div><button className="button button--light" onClick={() => open('settings')}><Settings size={16} /> 利き手・レベルを変更</button></div>
      <div className="practice-tabs"><button className={tab === 'plan' ? 'practice-tabs__active' : ''} onClick={() => setTab('plan')}><Sparkles size={15} />メニューをつくる</button><button className={tab === 'list' ? 'practice-tabs__active' : ''} onClick={() => setTab('list')}><ListChecks size={15} />練習を探す <span>24</span></button><button className={tab === 'favorites' ? 'practice-tabs__active' : ''} onClick={() => setTab('favorites')}><Bookmark size={15} />お気に入り <span>{state.favoriteDrills.length}</span></button></div>

      {tab === 'plan' ? <div className="plan-builder"><div className="plan-builder__form">
        <section className="builder-step"><div className="builder-step__heading"><span>01</span><div><b>今日の環境</b><small>使える設備と相手に合わせます。</small></div></div><div className="environment-picks">{(['home', 'solo', 'partner'] as TrainingEnvironment[]).map((value) => { const Icon = value === 'home' ? House : value === 'solo' ? Activity : Users; return <button key={value} type="button" className={environment === value ? 'environment-pick environment-pick--active' : 'environment-pick'} onClick={() => setEnvironmentSafe(value)}><span className="environment-pick__icon"><Icon size={19} /></span><span><b>{value === 'home' ? '台なし' : value === 'solo' ? '台あり・ひとり' : '台あり・相手あり'}</b><small>{value === 'home' ? 'シャドーや足運び' : value === 'solo' ? 'サーブやひとり練習' : 'ラリーやペア練習'}</small></span>{environment === value && <Check size={16} />}</button> })}</div></section>
        <section className="builder-step"><div className="builder-step__heading"><span>02</span><div><b>つかえる道具</b><small>台なし練習は道具がなくても始められます。</small></div></div><div className="equipment-row"><button className={state.profile.hasRacket ? 'equipment-chip equipment-chip--active' : 'equipment-chip'} onClick={() => changeProfile({ hasRacket: !state.profile.hasRacket })}><span>{state.profile.hasRacket ? <Check size={14} /> : <span />}</span>ラケット</button><button className={state.profile.hasBall ? 'equipment-chip equipment-chip--active' : 'equipment-chip'} onClick={() => changeProfile({ hasBall: !state.profile.hasBall })}><span>{state.profile.hasBall ? <Check size={14} /> : <span />}</span>ボール</button><span className="equipment-row__note"><Info size={13} />置いていっても、道具なしの練習に調整します。</span></div></section>
        <section className="builder-step"><div className="builder-step__heading"><span>03</span><div><b>今日の練習時間</b><small>準備や休憩を含む目安です。</small></div></div><div className="duration-picks">{([15, 30, 60] as const).map((value) => { const available = buildPlan(state.profile, environment, value, goal) !== null; return <button type="button" key={value} disabled={!available} className={minutes === value ? 'duration-pick duration-pick--active' : 'duration-pick'} onClick={() => setMinutes(value)}><b>{value}</b><span>分</span>{value === 15 && <small>ちょっとだけ</small>}{value === 30 && <small>いつもの練習</small>}{value === 60 && <small>{environment === 'home' ? '台ありのみ' : 'じっくり'}</small>}</button> })}</div></section>
        <section className="builder-step builder-step--last"><div className="builder-step__heading"><span>04</span><div><b>今日の目標</b><small>目的に近い練習を選びます。</small></div></div><div className="goal-select-wrap"><Compass size={17} /><select value={goal} onChange={(event) => { setGoal(event.target.value); changeProfile({ goal: event.target.value }) }}>{GOALS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></div></section>
      </div>

      <aside className="plan-preview"><div className="plan-preview__image"><HeroTableArt /><span><Sparkles size={14} /> YOUR DAILY MIX</span></div><div className="plan-preview__body"><div className="plan-preview__pills"><span>{ENVIRONMENT_NAMES[environment]}</span><span>{minutes}分</span><span>{state.profile.hand === 'right' ? '右利き' : '左利き'}</span></div><h2>{plan?.title ?? '練習メニューを選ぼう'}</h2><p>{plan?.reason ?? '場所に合わせて時間と内容を選びましょう。'}</p>{plan && <div className="plan-preview__schedule">{plan.blocks.slice(0, 5).map((block, index) => { const currentDrill = block.drillId ? drillById(block.drillId) : undefined; const alternatives = DRILLS.filter((item) => item.environment.includes(environment) && (state.profile.level === '発展' || item.level === '基礎') && (!item.equipment.includes('ラケット') || state.profile.hasRacket) && (!item.equipment.includes('球') || state.profile.hasBall)); return <div key={block.id} className={`schedule-row schedule-row--${block.phase}`}><span className="schedule-row__time">{String(index + 1).padStart(2, '0')}</span><span className="schedule-row__dot" /><b>{block.title}</b><span>{block.duration / 60}分</span>{currentDrill && alternatives.length > 1 && <button type="button" className="schedule-row__swap" onClick={() => { const currentIndex = alternatives.findIndex((item) => item.id === currentDrill.id); const next = alternatives[(currentIndex + 1) % alternatives.length]; if (next) setPlanEdits((current) => ({ ...current, [block.id]: next.id })) }}>入れ替え</button>}</div>})}{plan.blocks.length > 5 && <span className="schedule-more">ほか {plan.blocks.length - 5}ステップ · 合計 {plan.minutes} 分</span>}</div>}{missingGear.length > 0 && <div className="equipment-warning"><Info size={15} /><span>{environment === 'home' ? '道具なしの練習に変更して、時間を保ちます。' : 'このメニューにはラケットとボールが必要です。上の道具設定を確認してください。'}</span></div>}<button className="button button--forest plan-preview__button" disabled={!canStart} onClick={runPlan}>練習の内容を確認 <ArrowRight size={17} /></button><small className="plan-preview__fine">{plan?.blocks.length ?? 0} ステップ・タイマー付き</small></div></aside></div>
      : <><div className="drill-library-heading"><div><h2>{tab === 'favorites' ? 'お気に入りの練習' : `${ENVIRONMENT_NAMES[environment]}でできる練習`}</h2><p>{visibleDrills.length}種目から選べます · 目的・環境で絞り込まれます</p></div><label className="search-box search-box--small"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="練習を検索…" /></label></div>{visibleDrills.length ? <div className="drill-grid">{visibleDrills.map((drill) => <DrillCard key={drill.id} drill={drill} state={state} setState={setState} />)}</div> : <EmptyState icon={Bookmark} title={tab === 'favorites' ? 'お気に入りの練習はまだありません' : '練習が見つかりません'} detail={tab === 'favorites' ? '練習カードのしおりを押して保存できます。' : '環境や検索の言葉を変えてみましょう。'} action="すべての練習を表示" onAction={() => { setTab('list'); setQuery('') }} />}</>}
      {tab === 'plan' && <div className="drills-below-builder"><SectionHeading eyebrow="QUICK PRACTICE" title="1種目だけ練習する" detail="5分ほどの短い練習も選べます。" action="練習を探す" onAction={() => setTab('list')} /><div className="drill-grid drill-grid--short">{DRILLS.filter((drill) => drill.environment.includes(environment) && (state.profile.level === '発展' || drill.level === '基礎')).slice(0, 3).map((drill) => <DrillCard key={drill.id} drill={drill} state={state} setState={setState} />)}</div></div>}
    </div>
  )
}

function PlanConfirmScreen({ plan, state, start, open }: { plan: WorkoutPlan | null; state: AppState; start: (plan: WorkoutPlan) => void; open: (page: string) => void }) {
  if (!plan) return <div className="page-shell page-enter"><button className="back-link" onClick={() => open('practice')}><ArrowLeft size={16} />練習を選び直す</button><EmptyState icon={Dumbbell} title="このメニューは選べませんでした" detail="環境と時間をもう一度選んでください。" action="メニューを選ぶ" onAction={() => open('practice')} /></div>
  const drillBlocks = plan.blocks.filter((block) => block.drillId)
  const missed = plan.blocks.some((block) => {
    const drill = block.drillId ? drillById(block.drillId) : undefined
    return drill?.equipment.some((item) => item === 'ラケット' && !state.profile.hasRacket || item === '球' && !state.profile.hasBall)
  })
  return <div className="page-shell confirm-page page-enter"><button className="back-link" onClick={() => open('practice')}><ArrowLeft size={16} />メニューの条件を変更</button><div className="page-heading"><div><span className="eyebrow">YOUR SESSION</span><h1>はじめる前に、<span>内容を確認。</span></h1><p>準備、休憩、整理運動まで含めたメニューです。</p></div></div><div className="confirm-summary"><span><Clock3 size={18} /><b>{plan.minutes}分</b></span><span><House size={18} />{ENVIRONMENT_NAMES[plan.environment]}</span><span><Dumbbell size={18} />{drillBlocks.length}種目</span><span><Activity size={18} />{plan.level === '基礎' ? 'はじめの一歩' : 'ステップアップ'}</span></div><div className="confirm-grid"><div className="confirm-list"><div className="confirm-list__header"><b>{plan.title}</b><span>全{plan.blocks.length}ステップ</span></div>{plan.blocks.map((block, index) => <ScheduleBlock key={block.id} block={block} number={index + 1} onDrill={drillDestination} />)}</div><aside className="confirm-aside"><div className="confirm-art"><HeroTableArt /><span><Sparkles size={15} />ONE STEP AT A TIME</span></div><div className="confirm-aside__body"><span className="eyebrow">今日の目標</span><h2>{plan.goal}</h2><p>{plan.reason}</p><div className="confirm-cue"><Lightbulb size={18} /><span>フォームを一つ意識しよう。<small>{drillById(drillBlocks[0]?.drillId ?? '')?.cue ?? '自分のペースで続ける。'}</small></span></div>{missed && <div className="equipment-warning"><Info size={14} />台の練習にはラケットとボールが必要です。<button onClick={() => open('practice')}>道具を設定する</button></div>}<button disabled={missed} className="button button--forest confirm-start" onClick={() => start(plan)}><Play size={17} fill="currentColor" />練習をはじめる</button><button className="button-link" onClick={() => open('learn')}>まずフォームを予習する <ArrowRight size={14} /></button></div></aside></div></div>
}

function ScheduleBlock({ block, number, onDrill }: { block: PlanBlock; number: number; onDrill: (id: string) => void }) {
  const Icon = block.phase === 'warmup' ? Flame : block.phase === 'rest' ? Clock3 : block.phase === 'cooldown' ? Sparkles : Dumbbell
  const drill = block.drillId ? drillById(block.drillId) : undefined
  return <div className={`confirm-row confirm-row--${block.phase}`}><span className="confirm-row__number">{String(number).padStart(2, '0')}</span><span className="confirm-row__icon"><Icon size={16} /></span><div className="confirm-row__copy"><b>{block.title}</b><span>{block.detail}</span>{drill && <span className="confirm-row__goal">今日のコツ：{drill.cue}</span>}{drill && <button className="inline-drill-link" onClick={() => onDrill(drill.id)}>練習の図を見る <ArrowRight size={13} /></button>}</div><span className="confirm-row__duration">{block.duration / 60}分</span></div>
}

function DrillScreen({ drill, state, setState, open, startQuick, onDiagram }: { drill: Drill; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void; startQuick: (drill: Drill) => void; onDiagram: (drill: Drill) => void }) {
  const saved = state.favoriteDrills.includes(drill.id)
  const lessons = drill.lessons.map((id) => lessonById(id)).filter((lesson): lesson is Lesson => Boolean(lesson))
  return <div className="page-shell detail-page page-enter"><button className="back-link" onClick={() => open('practice')}><ArrowLeft size={16} />練習一覧</button><div className="detail-heading drill-detail-heading"><div><div className="detail-heading__meta"><span className={`level-chip ${drill.level === '発展' ? 'level-chip--advanced' : ''}`}>{LEVEL_NAMES[drill.level]}</span><span>{ENVIRONMENT_NAMES[drill.environment[0]]}</span><span>{drill.duration}分</span></div><h1>{drill.title}</h1><p>{drill.summary}</p></div><SmallButton className={`detail-save ${saved ? 'icon-button--saved' : ''}`} onClick={() => setState((current) => ({ ...current, favoriteDrills: saved ? current.favoriteDrills.filter((id) => id !== drill.id) : [...current.favoriteDrills, drill.id] }))} ariaLabel="練習のお気に入り">{saved ? <Bookmark size={18} fill="currentColor" /> : <Bookmark size={18} />}</SmallButton></div><div className="drill-hero-layout"><button className="drill-detail-art" onClick={() => onDiagram(drill)} aria-label={`${drill.title}の練習図を拡大`}><Illustration drill={drill} hand={state.profile.hand} kind="layout" /><span className="zoom-hint"><Maximize size={14} />練習の図を拡大</span></button><aside className="drill-detail-side"><span className="eyebrow">YOUR FOCUS</span><div className="focus-quote"><Sparkles size={16} />{drill.cue}</div><h3>必要なもの</h3><div className="gear-chips">{drill.equipment.length ? drill.equipment.map((item) => <span key={item}><Check size={13} />{item}</span>) : <span><Check size={13} />場所があればOK</span>}</div><div className="drill-target"><span>今日の目安</span><b>{drill.target}</b><small>達成しなくても記録できます。</small></div><button className="button button--forest" onClick={() => startQuick(drill)}><Play size={16} fill="currentColor" />この練習をはじめる <span>約{drill.duration}分</span></button></aside></div>
    <div className="drill-instructions"><section className="drill-how"><SectionHeading eyebrow="HOW TO PRACTICE" title="練習の進め方" detail="自分のペースで、一つずつ確かめます。" />{drill.steps.map((item, index) => <div key={item} className="drill-how__row"><span>{String(index + 1).padStart(2, '0')}</span><b>{item}</b></div>)}</section><section className="drill-adapt"><SectionHeading eyebrow="MAKE IT YOUR OWN" title="難しさを調整する" /><div className="adapt-card"><span>もっとやさしく</span><p>{drill.easier}</p><ArrowDownLeft size={16} /></div><div className="adapt-card adapt-card--up"><span>慣れてきたら</span><p>{drill.harder}</p><ArrowRight size={16} /></div><div className="metric-card"><Target size={16} /><span>{drill.metric}<small>目安は自由に記録できます。</small></span></div></section></div>
    {lessons.length > 0 && <section className="related-drills"><SectionHeading eyebrow="LEARN FIRST" title="フォームを先に見る" detail="練習で意識するところを、図で確認。" /><div className="related-drills__row">{lessons.map((lesson) => <button className="related-drill" key={lesson.id} onClick={() => lessonDestination(lesson.id)}><span className="related-drill__number">{lesson.id}</span><span><b>{lesson.title}</b><small>{lesson.summary}</small></span><span className="related-drill__time">{LEVEL_NAMES[lesson.level]}</span><ChevronRight size={17} /></button>)}</div></section>}
  </div>
}

function HistoryScreen({ state, setState, open }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'in-progress'>('all')
  const sessions = filter === 'all' ? state.sessions : state.sessions.filter((session) => session.skippedDrillIds.length > 0)
  const totalSeconds = state.sessions.reduce((sum, item) => sum + item.activeSeconds, 0)
  const totalDrills = state.sessions.reduce((sum, item) => sum + item.completedDrillIds.length, 0)
  const uniqueDays = new Set(state.sessions.map((item) => new Date(item.finishedAt).toDateString())).size
  const deleteSession = (id: string) => setState((current) => ({ ...current, sessions: current.sessions.filter((session) => session.id !== id) }))
  return <div className="page-shell history-page page-enter"><div className="page-heading"><div><span className="eyebrow">YOUR TRAINING LOG</span><h1>積み重ねが、<span>見える場所。</span></h1><p>できた日も、ちょっとだけの日も。練習した分だけ記録されます。</p></div><button className="button button--soft" onClick={() => open('practice')}><Play size={15} />練習を選ぶ</button></div><div className="history-stats"><div><Clock3 size={18} /><span>練習時間<b>{Math.floor(totalSeconds / 60)}<small>分</small></b></span></div><div><ListChecks size={18} /><span>練習した種目<b>{totalDrills}<small>種目</small></b></span></div><div><Award size={18} /><span>練習した日<b>{uniqueDays}<small>日</small></b></span></div></div><div className="history-toolbar"><div><h2>練習の記録</h2><p>{state.sessions.length ? `${state.sessions.length}回の練習が保存されています。` : '練習を終えると、ここに記録が並びます。'}</p></div><div className="filter-toggle"><button className={filter === 'all' ? 'filter-toggle__active' : ''} onClick={() => setFilter('all')}>すべて <small>{state.sessions.length}</small></button><button className={filter === 'in-progress' ? 'filter-toggle__active' : ''} onClick={() => setFilter('in-progress')}>途中まで <small>{state.sessions.filter((session) => session.skippedDrillIds.length > 0).length}</small></button></div></div>
    {sessions.length ? <div className="history-list">{sessions.map((session) => <HistoryRecord key={session.id} session={session} onOpen={() => go(`history/${session.id}`)} onDelete={() => deleteSession(session.id)} />)}</div> : <EmptyState icon={Clock3} title={filter === 'all' ? 'ここから積み重ねていこう' : '途中の記録はありません'} detail={filter === 'all' ? 'ひとつの練習を終えると、日時や気づきが自動で残ります。' : '途中までの練習記録があると表示されます。'} action="練習メニューを選ぶ" onAction={() => open('practice')} />}</div>
}

function HistoryRecord({ session, onOpen, onDelete }: { session: SessionRecord; onOpen: () => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const exercises = session.completedDrillIds.map((id) => drillById(id)).filter(Boolean)
  return <article className="history-row"><button className="history-row__main" onClick={onOpen}><span className="history-row__date"><b>{formatDate(session.finishedAt, { day: 'numeric' })}</b><small>{formatDate(session.finishedAt, { year: 'numeric', month: 'long' })}</small><i>{new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(new Date(session.finishedAt))}</i></span><span className="history-row__content"><b>{session.planTitle}</b><span className="history-row__meta"><span>{session.goal}</span><span>{ENVIRONMENT_NAMES[session.environment]}</span><span><Clock3 size={12} />{Math.floor(session.activeSeconds / 60)}分</span></span><span className="history-row__tags">{exercises.slice(0, 3).map((drill, index) => <i key={`${drill?.id}-${index}`}>{drill?.title}</i>)}{session.skippedDrillIds.length > 0 && <i className="history-row__skip">途中終了</i>}</span>{session.note && <small className="history-row__note">“{session.note}”</small>}</span><ChevronRight size={18} className="history-row__arrow" /></button>{confirm ? <div className="history-row__confirm"><span>この練習記録を削除しますか？</span><button onClick={onDelete}>削除する</button><button onClick={() => setConfirm(false)}>キャンセル</button></div> : <SmallButton className="history-row__delete" onClick={() => setConfirm(true)} ariaLabel="記録を削除"><X size={16} /></SmallButton>}</article>
}

function SettingsScreen({ state, setState, pwa, open }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; pwa: PwaState; open: (page: string) => void }) {
  const changeProfile = (patch: Partial<UserProfile>) => setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }))
  const wipe = () => {
    if (!window.confirm('すべての練習記録とお気に入りを削除します。この操作は元に戻せません。')) return
    setState((current) => ({ ...current, favoriteLessons: [], favoriteDrills: [], seenLessons: [], sessions: [], activeSession: null }))
    releaseSessionLock()
  }
  return <div className="page-shell settings-page page-enter"><div className="page-heading"><div><span className="eyebrow">YOUR SPACE</span><h1>自分に合う、<span>練習の設定。</span></h1><p>利き手や今日の練習環境は、いつでも変えられます。</p></div></div><div className="settings-layout"><div className="settings-groups"><section className="settings-card"><div className="settings-card__heading"><span className="settings-card__icon settings-card__icon--green"><Activity size={18} /></span><div><b>プロフィール</b><small>教材の図とおすすめに反映します。</small></div></div><div className="setting-line"><div><b>利き手</b><small>イラストの向きが切り替わります。</small></div><div className="setting-segment"><button className={state.profile.hand === 'right' ? 'setting-segment__active' : ''} onClick={() => changeProfile({ hand: 'right' })}>右利き</button><button className={state.profile.hand === 'left' ? 'setting-segment__active' : ''} onClick={() => changeProfile({ hand: 'left' })}>左利き</button></div></div><div className="setting-line"><div><b>練習のレベル</b><small>経験に合わせた練習を選びます。</small></div><div className="setting-segment"><button className={state.profile.level === '基礎' ? 'setting-segment__active' : ''} onClick={() => changeProfile({ level: '基礎' })}>基本から</button><button className={state.profile.level === '発展' ? 'setting-segment__active' : ''} onClick={() => changeProfile({ level: '発展' })}>ステップアップ</button></div></div><div className="setting-line"><div><b>今日の目標</b><small>メニューで意識すること。</small></div><select className="settings-select" value={state.profile.goal} onChange={(event) => changeProfile({ goal: event.target.value })}>{GOALS.map((goal) => <option key={goal}>{goal}</option>)}</select></div></section>
      <section className="settings-card"><div className="settings-card__heading"><span className="settings-card__icon settings-card__icon--peach"><House size={18} /></span><div><b>いつもの練習環境</b><small>練習メニューの初期値です。</small></div></div><div className="setting-choice-list">{(['home', 'solo', 'partner'] as TrainingEnvironment[]).map((environment) => <button key={environment} className={state.profile.environment === environment ? 'setting-choice setting-choice--active' : 'setting-choice'} onClick={() => changeProfile({ environment })}><span className="setting-choice__check">{state.profile.environment === environment && <Check size={13} />}</span><b>{ENVIRONMENT_NAMES[environment]}</b><small>{environment === 'home' ? 'ひとりでできる練習' : environment === 'solo' ? '台を使うひとり練習' : '相手との練習'}</small></button>)}</div><div className="equipment-settings"><b>持っていける道具</b><div><button className={`equipment-chip ${state.profile.hasRacket ? 'equipment-chip--active' : ''}`} onClick={() => changeProfile({ hasRacket: !state.profile.hasRacket })}>{state.profile.hasRacket ? <Check size={14} /> : <span />}ラケット</button><button className={`equipment-chip ${state.profile.hasBall ? 'equipment-chip--active' : ''}`} onClick={() => changeProfile({ hasBall: !state.profile.hasBall })}>{state.profile.hasBall ? <Check size={14} /> : <span />}ボール</button></div></div></section>
      <section className="settings-card settings-card--offline"><div className="settings-card__heading"><span className="settings-card__icon settings-card__icon--blue">{pwa.offline === 'ready' ? <ShieldCheck size={18} /> : <Wifi size={18} />}</span><div><b>オフラインとホーム画面</b><small>{pwa.offline === 'ready' ? '保存済みの画面とイラストを、通信なしで使えます。' : 'オンラインで準備すると、練習の記録も図も使えます。'}</small></div></div>{pwa.message && <p className={`offline-detail offline-detail--${pwa.offline}`}>{pwa.message}{pwa.total > 0 && pwa.offline === 'preparing' && <span>{pwa.cached} / {pwa.total}</span>}</p>}<div className="settings-offline-actions"><button className="button button--soft" onClick={() => open('install')}>ホーム画面に追加する <ArrowRight size={15} /></button>{pwa.offline !== 'ready' && <button className="button-link" onClick={() => void prepareOfflineNow()}>オフライン用に保存 <RotateCcw size={14} /></button>}</div><small className="storage-note">練習記録はこのブラウザに保存します。サイトデータを削除した場合は記録も消えます。</small></section>
      <section className="settings-card settings-card--danger"><div className="settings-card__heading"><span className="settings-card__icon settings-card__icon--gray"><Info size={18} /></span><div><b>データを管理</b><small>練習記録とお気に入りを削除できます。</small></div></div><button className="delete-data-button" onClick={wipe}>すべての練習記録・お気に入りを削除 <ArrowRight size={15} /></button></section></div><aside className="settings-aside"><div className="settings-aside__art"><HeroTableArt /></div><span className="eyebrow">A FEW WORDS</span><h3>比べる相手は、<br />昨日の自分。</h3><p>記録はあなたの練習を振り返るためのもの。フォームができたかどうかを、アプリが決めることはありません。</p><div className="settings-aside__rule" /><span className="settings-version">PINGPONG <i>·</i> Web app 1.0</span></aside></div></div>
}

function InstallScreen({ pwa, open }: { pwa: PwaState; open: (page: string) => void }) {
  const [installMessage, setInstallMessage] = useState('')
  const install = async () => {
    const result = await installPwa()
    setInstallMessage(result === 'accepted' ? 'ホーム画面への追加を開始しました。' : result === 'dismissed' ? 'いつでも後から追加できます。' : 'ブラウザの共有メニューから「ホーム画面に追加」を選んでください。')
  }
  return <div className="page-shell install-page page-enter"><button className="back-link" onClick={() => open('settings')}><ArrowLeft size={16} />設定へ</button><div className="install-hero"><div className="install-hero__copy"><span className="eyebrow">TAKE IT TO THE TABLE</span><h1>いつものホームに、<br /><span>練習場所を。</span></h1><p>ホーム画面に追加すると、アプリのようにすぐ開けます。もちろん、ブラウザからそのまま使っても大丈夫。</p><button className="button button--forest" onClick={() => void install()}>ホーム画面に追加 <ArrowRight size={16} /></button>{installMessage && <span className="install-result">{installMessage}</span>}</div><div className="install-hero__image"><img src={`${import.meta.env.BASE_URL}pingpong.svg`} alt="PINGPONGのアイコン" /><div><b>PINGPONG</b><span>卓球の練習</span></div><div className="phone-lines"><span/><span/><span/><span/></div></div></div><div className="install-steps"><section><span className="install-steps__number">01</span><span className="install-steps__icon"><ArrowRight size={19} /></span><h2>iPhone · Safari</h2><p>画面下の<strong>共有</strong>アイコンを押し、「<strong>ホーム画面に追加</strong>」を選んでください。</p><div className="browser-badge">Safari <span>›</span></div></section><section><span className="install-steps__number">02</span><span className="install-steps__icon"><Plus size={19} /></span><h2>Android · Chrome</h2><p>右上の<strong>メニュー</strong>を開いて、「<strong>ホーム画面に追加</strong>」を選んでください。</p><div className="browser-badge">Chrome <span>⋮</span></div></section><section className="install-steps__offline"><span className="install-steps__number">03</span><span className="install-steps__icon"><Wifi size={19} /></span><h2>オフラインでも使う</h2><p>一度オンラインで開くと、画面とイラストを保存できます。記録はこのブラウザの中に保存されます。</p><div className={`offline-detail offline-detail--${pwa.offline}`}>{pwa.offline === 'ready' ? <><ShieldCheck size={14} /> オフライン利用の準備ができています</> : pwa.offline === 'preparing' ? <><LoaderCircle className="spin-icon" size={14} /> 画面を保存しています {pwa.cached}/{pwa.total}</> : <><CloudOff size={14} /> {pwa.offline === 'error' ? '保存できませんでした。通信を確かめて再試行してください。' : '通信できる場所で一度開いてください。'}</>}</div></section></div>{pwa.offline !== 'ready' && <button className="button button--soft install-save" onClick={() => void prepareOfflineNow()}><RotateCcw size={15} /> オフライン用の画面を保存</button>}</div>
}

function ReviewScreen({ state, setState, open }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void }) {
  const [difficulty, setDifficulty] = useState<SessionRecord['difficulty']>('just-right')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const session = state.activeSession
  if (saved) return <div className="review-saved page-enter"><span className="review-saved__badge"><BadgeCheck size={20} />記録しました</span><h1>今日の練習、<br />おつかれさまでした。</h1><p>小さな一歩も、ちゃんと積み重なっています。</p><div className="review-saved__actions"><button className="button button--forest" onClick={() => open('history')}>練習記録を見る <ArrowRight size={16} /></button><button className="button button--soft" onClick={() => open('home')}>ホームに戻る</button></div><div className="review-saved__art"><HeroTableArt /></div></div>
  if (!session) return <div className="page-shell"><EmptyState icon={Clock3} title="振り返る練習がありません" detail="練習を始めると、ここで記録できます。" action="練習を選ぶ" onAction={() => open('practice')} /></div>
  const complete = session.completedIndices.length
  const completedDrills = session.completedIndices.map((index) => session.plan.blocks[index]).filter((block) => block?.drillId).map((block) => block!.drillId!)
  const skippedDrills = session.skippedIndices.map((index) => session.plan.blocks[index]).filter((block) => block?.drillId).map((block) => block!.drillId!)
  const finish = () => {
    const record: SessionRecord = {
      id: session.id,
      planTitle: session.plan.title,
      goal: session.plan.goal,
      environment: session.plan.environment,
      startedAt: session.startedAt,
      finishedAt: Date.now(),
      plannedSeconds: session.plan.minutes * 60,
      activeSeconds: getSessionElapsed(session),
      completedDrillIds: completedDrills,
      skippedDrillIds: skippedDrills,
      difficulty,
      note: note.slice(0, 300),
      achievements: session.achievements,
    }
    setState((current) => ({ ...current, sessions: [record, ...current.sessions.filter((item) => item.id !== record.id)], activeSession: null }))
    releaseSessionLock()
    setSaved(true)
  }
  return <div className="page-shell review-page page-enter"><div className="review-heading"><span className="review-heading__icon"><Trophy size={23} /></span><div><span className="eyebrow">SESSION COMPLETE</span><h1>練習、おつかれさま！</h1><p>{session.plan.title}に取り組みました。</p></div></div><div className="review-result"><div><span><Clock3 size={15} />今日の時間</span><b>{Math.floor(getSessionElapsed(session) / 60)}<small>分</small></b></div><div><span><Check size={15} />できたステップ</span><b>{complete}<small> / {session.plan.blocks.length}</small></b></div><div><span><Dumbbell size={15} />練習した種目</span><b>{completedDrills.length}<small> 種目</small></b></div></div><section className="reflection-card"><div className="reflection-card__heading"><span className="eyebrow">YOUR REFLECTION</span><h2>今日の感覚を残しておこう</h2><p>正解はありません。後から見返すための記録です。</p></div><div className="reflection-question"><b>練習の難しさはどうでしたか？</b><div className="difficulty-picks">{([{ id: 'easy', label: 'すこし余裕', icon: '◎' }, { id: 'just-right', label: 'ちょうどいい', icon: '◉' }, { id: 'hard', label: 'むずかしかった', icon: '◌' }] as const).map((item) => <button key={item.id} className={difficulty === item.id ? 'difficulty-pick difficulty-pick--active' : 'difficulty-pick'} onClick={() => setDifficulty(item.id)}><span>{item.icon}</span>{item.label}</button>)}</div></div><label className="note-label">次に意識したいこと <span>任意 · 300文字まで</span><textarea value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} placeholder="「フォアの後に、構えに戻るのを忘れない」など…" /><small className="note-length">{note.length} / 300</small></label><div className="reflection-caution"><Info size={15} /><span>タイマーは取り組んだ時間を記録します。フォームの習得度は判定しません。</span></div><button className="button button--forest reflection-save" onClick={finish}><Check size={16} />記録を保存する</button></section><button className="button-link review-skip-save" onClick={finish}>振り返りを記入せずに記録 <ArrowRight size={14} /></button></div>
}

function ActiveWorkout({ session, state, setState }: { session: ActiveSession; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const [now, setNow] = useState(Date.now())
  const [lockConflict, setLockConflict] = useState(() => { const lock = getLiveSessionLock(); return Boolean(lock && lock.owner !== TAB_ID) })
  const block = session.plan.blocks[session.currentIndex]
  const currentSeconds = Math.min(block?.duration ?? 0, session.blockElapsedSeconds + (session.status === 'running' && session.blockStartedAt ? Math.floor((now - session.blockStartedAt) / 1000) : 0))
  const remaining = Math.max(0, (block?.duration ?? 0) - currentSeconds)
  const progress = block ? Math.min(100, currentSeconds / block.duration * 100) : 100
  const isLast = session.currentIndex >= session.plan.blocks.length - 1
  const drill = block?.drillId ? drillById(block.drillId) : undefined
  const completed = session.completedIndices.length + session.skippedIndices.length

  useEffect(() => {
    const lock = getLiveSessionLock()
    if (lock && lock.owner !== TAB_ID) setLockConflict(true)
    const interval = window.setInterval(() => {
      setNow(Date.now())
      const current = session
      if (current.status === 'running') refreshSessionLock(current.id)
    }, 3000)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'pingpong-active-session-lease') return
      const lock = getLiveSessionLock()
      setLockConflict(Boolean(lock && lock.owner !== TAB_ID && lock.sessionId === session.id))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause()
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // pause reads the latest session through functional state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.currentIndex, session.status, session.blockStartedAt, session.blockElapsedSeconds])

  useEffect(() => {
    if (session.status !== 'running' || remaining > 0 || !block) return
    setState((current) => {
      if (!current.activeSession || current.activeSession.id !== session.id || current.activeSession.status !== 'running') return current
      return { ...current, activeSession: { ...current.activeSession, status: 'paused', blockElapsedSeconds: block.duration, blockStartedAt: null } }
    })
  }, [session.id, session.status, remaining, block, setState])

  const savePause = () => {
    setNow(Date.now())
    setState((current) => {
      const active = current.activeSession
      if (!active || active.status !== 'running') return current
      const elapsed = active.blockStartedAt ? Math.floor((Date.now() - active.blockStartedAt) / 1000) : 0
      return { ...current, activeSession: { ...active, status: 'paused', blockElapsedSeconds: Math.min(active.plan.blocks[active.currentIndex]?.duration ?? 0, active.blockElapsedSeconds + elapsed), blockStartedAt: null } }
    })
  }
  function pause() { savePause() }

  const advance = (skip = false) => {
    setState((current) => {
      const active = current.activeSession
      if (!active) return current
      const completeSet = new Set(active.completedIndices)
      const skippedSet = new Set(active.skippedIndices)
      if (skip) skippedSet.add(active.currentIndex)
      else completeSet.add(active.currentIndex)
      const next = active.currentIndex + 1
      if (next >= active.plan.blocks.length) return { ...current, activeSession: { ...active, completedIndices: [...completeSet], skippedIndices: [...skippedSet], status: 'review', blockStartedAt: null } }
      const resumed: ActiveSession = { ...active, currentIndex: next, blockElapsedSeconds: 0, blockStartedAt: Date.now(), status: 'running', completedIndices: [...completeSet], skippedIndices: [...skippedSet] }
      if (!skip && !claimSessionLock(active.id)) return { ...current, activeSession: { ...active, status: 'paused', blockStartedAt: null }, }
      return { ...current, activeSession: resumed }
    })
  }

  const resume = () => {
    if (lockConflict || !claimSessionLock(session.id)) { setLockConflict(true); return }
    setLockConflict(false)
    setState((current) => {
      const active = current.activeSession
      if (!active) return current
      return { ...current, activeSession: { ...active, status: 'running', blockStartedAt: Date.now() } }
    })
  }
  const setResult = (value: number) => setState((current) => {
    const active = current.activeSession
    if (!active || !block?.drillId) return current
    return { ...current, activeSession: { ...active, achievements: { ...active.achievements, [block.drillId]: value } } }
  })
  const openReview = () => { pause(); go('review') }
  const abandon = () => {
    if (!window.confirm('この練習を終了して、途中までの記録を振り返りますか？')) return
    pause()
    go('review')
  }

  if (!block || session.status === 'review') {
    go('review')
    return null
  }
  return <div className="training-screen"><header className="training-topbar"><Brand onClick={() => go('home')} /><span><span className="training-live-dot" />練習中 · {ENVIRONMENT_NAMES[session.plan.environment]}</span><button onClick={abandon}>終了する <X size={15} /></button></header><main className="training-main"><div className="training-step-count"><span>STEP {String(session.currentIndex + 1).padStart(2, '0')}<i> / {String(session.plan.blocks.length).padStart(2, '0')}</i></span><span>{completed} ステップ完了</span></div><div className="training-progress"><span style={{ width: `${Math.max(3, completed / session.plan.blocks.length * 100)}%` }} /></div><div className="training-layout"><section className="training-timer-panel"><div className={`training-phase training-phase--${block.phase}`}><span className="training-phase__icon">{block.phase === 'warmup' ? <Flame size={18} /> : block.phase === 'rest' ? <Clock3 size={18} /> : block.phase === 'cooldown' ? <Sparkles size={18} /> : <Dumbbell size={18} />}</span>{block.phase === 'warmup' ? 'WARM UP' : block.phase === 'rest' ? 'TAKE A BREATH' : block.phase === 'cooldown' ? 'COOL DOWN' : 'YOUR DRILL'}</div><h1>{block.title}</h1><p>{block.detail}</p><div className={`clock-face ${session.status === 'running' ? 'clock-face--running' : ''}`}><svg viewBox="0 0 254 254" aria-hidden="true"><circle className="clock-face__track" cx="127" cy="127" r="111" /><circle className="clock-face__progress" cx="127" cy="127" r="111" style={{ strokeDashoffset: `${697.4 * (1 - progress / 100)}` }} /></svg><div><strong>{formatClock(remaining)}</strong><span>{session.status === 'running' ? 'のこり時間' : remaining === 0 ? 'ステップ完了' : '一時停止中'}</span></div><span className="clock-face__spark">✳</span></div>{drill && <div className="training-cue"><span><Lightbulb size={17} /></span><div><small>今日のコツ</small><b>{drill.cue}</b></div></div>}{session.status === 'running' && !lockConflict ? <div className="training-controls"><button className="button button--sun" onClick={pause}><Pause size={19} fill="currentColor" />一時停止</button><button className="training-skip" onClick={() => advance(true)}>スキップ <SkipForward size={16} /></button></div> : <div className="training-controls"><button className={`button ${remaining === 0 ? 'button--sun' : 'button--forest'}`} onClick={remaining === 0 ? () => advance(false) : resume} disabled={lockConflict}>{lockConflict ? <><Info size={17} />ほかのタブで練習中です</> : remaining === 0 ? isLast ? <><Check size={18} />練習を振り返る</> : <><ArrowRight size={18} />次のステップへ</> : <><Play size={18} fill="currentColor" />続きを再開する</>}</button>{remaining > 0 && !lockConflict && <button className="training-skip" onClick={() => advance(true)}>スキップ <SkipForward size={16} /></button>}</div>}</section><aside className="training-side-panel"><div className="training-illustration">{drill ? <Illustration drill={drill} hand={state.profile.hand} kind="layout" compact /> : <div className="training-warmup-art"><HeroTableArt /></div>}</div><div className="training-next-cue"><span className="eyebrow">PLAN</span><b>{session.plan.title}</b><span>{session.plan.minutes}分 · {session.plan.goal}</span></div><div className="training-up-next"><span className="eyebrow">NEXT</span><b>{session.plan.blocks[session.currentIndex + 1]?.title ?? '最後のステップです'}</b><span>{session.plan.blocks[session.currentIndex + 1] ? `${session.plan.blocks[session.currentIndex + 1].duration / 60}分` : '練習を振り返ります'}</span></div></aside></div>{drill?.metric.includes('任意入力') && <label className="quick-metric">きょうの数を記録 <span>任意</span><input type="number" min={0} max={1000} value={session.achievements[drill.id] ?? ''} onChange={(event) => setResult(Math.max(0, Number(event.target.value)))} placeholder="—" /></label>}</main><footer className="training-footer"><span>{session.plan.goal}</span><span><Clock3 size={14} />{Math.floor(getSessionElapsed(session, now) / 60)}分 記録済み</span><button onClick={openReview}>途中までで振り返る <ArrowRight size={15} /></button></footer></div>
}

function HistoryDetail({ session, setState, open }: { session?: SessionRecord; setState: React.Dispatch<React.SetStateAction<AppState>>; open: (page: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(session?.note ?? '')
  const [difficulty, setDifficulty] = useState<SessionRecord['difficulty']>(session?.difficulty ?? 'just-right')
  const [saved, setSaved] = useState(false)
  if (!session) return <div className="page-shell"><EmptyState icon={Search} title="記録が見つかりません" detail="削除済みか、保存されたURLではないようです。" action="記録一覧へ" onAction={() => open('history')} /></div>
  const drills = session.completedDrillIds.map((id) => drillById(id)).filter((item): item is Drill => Boolean(item))
  const updateReflection = () => {
    setState((current) => ({ ...current, sessions: current.sessions.map((item) => item.id === session.id ? { ...item, note: note.slice(0, 300), difficulty } : item) }))
    setEditing(false)
    setSaved(true)
  }
  return <div className="page-shell history-detail page-enter"><button className="back-link" onClick={() => open('history')}><ArrowLeft size={16} />練習記録</button><span className="eyebrow">SESSION · {formatDate(session.finishedAt, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span><h1>{session.planTitle}</h1><div className="history-detail__stats"><span><Clock3 size={17} />{Math.floor(session.activeSeconds / 60)}分</span><span><Check size={17} />{session.completedDrillIds.length}種目</span><span>{ENVIRONMENT_NAMES[session.environment]}</span></div><section className="history-reflection"><div className="history-reflection__heading"><b>今日の振り返り</b>{!editing && <button type="button" className="button-link" onClick={() => { setNote(session.note); setDifficulty(session.difficulty); setEditing(true); setSaved(false) }}><Edit3 size={14} /> 編集する</button>}</div>{editing ? <><div className="difficulty-picks">{([{ id: 'easy', label: 'すこし余裕' }, { id: 'just-right', label: 'ちょうどいい' }, { id: 'hard', label: 'むずかしかった' }] as const).map((item) => <button key={item.id} type="button" className={difficulty === item.id ? 'difficulty-pick difficulty-pick--active' : 'difficulty-pick'} onClick={() => setDifficulty(item.id)}>{item.label}</button>)}</div><textarea className="history-reflection__input" value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} placeholder="次に意識したいこと（任意）" /><div className="history-reflection__actions"><button type="button" className="button button--forest" onClick={updateReflection}>変更を保存 <Check size={15} /></button><button type="button" className="button-link" onClick={() => setEditing(false)}>キャンセル</button><small>{note.length} / 300</small></div></> : <><span className="history-reflection__difficulty">難しさ：{session.difficulty === 'easy' ? 'すこし余裕' : session.difficulty === 'hard' ? 'むずかしかった' : 'ちょうどいい'}</span>{session.note ? <p>“{session.note}”</p> : <p className="history-reflection__empty">メモはありません。</p>}{saved && <small className="history-reflection__saved" role="status">変更を保存しました。</small>}</>}</section><div className="confirm-list history-detail__list"><div className="confirm-list__header"><b>取り組んだ内容</b><span>{drills.length}種目</span></div>{drills.map((drill, index) => <div key={`${drill.id}-${index}`} className="confirm-row confirm-row--drill"><span className="confirm-row__number">{String(index + 1).padStart(2, '0')}</span><span className="confirm-row__icon"><Dumbbell size={16} /></span><div className="confirm-row__copy"><b>{drill.title}</b><span>{drill.cue}</span></div><span className="confirm-row__duration">{drill.duration}分</span></div>)}</div><button className="button button--forest" onClick={() => open('practice')}>今日の練習を選ぶ <ArrowRight size={15} /></button></div>
}

function ZoomModal({ lesson, drill, kind, hand, close }: { lesson?: Lesson; drill?: Drill; kind: 'overview' | 'sequence' | 'compare' | 'detail' | 'layout'; hand: UserProfile['hand']; close: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])
  return <div className="zoom-backdrop" role="presentation" onClick={close}><div className="zoom-dialog" role="dialog" aria-modal="true" aria-label={`${lesson?.title ?? drill?.title ?? '学習'}の図を拡大`} onClick={(event) => event.stopPropagation()}><div className="zoom-dialog__top"><span>{lesson?.title ?? drill?.title}</span><button aria-label="拡大表示を閉じる" onClick={close}><X size={21} /></button></div><Illustration lesson={lesson} drill={drill} kind={kind} hand={hand} /><p className="zoom-dialog__explain">{lesson?.focus ?? drill?.cue}</p><span className="zoom-dialog__help">端末の拡大操作でもう少し大きくできます</span></div></div>
}

function ProgressToast({ message, close }: { message: string; close: () => void }) {
  useEffect(() => { const timeout = window.setTimeout(close, 3200); return () => clearTimeout(timeout) }, [message, close])
  return <div className="toast" role="status"><span className="toast__check"><Check size={15} /></span>{message}<button aria-label="閉じる" onClick={close}><X size={15} /></button></div>
}

export default function App() {
  const [route, routeTo] = useAppRoute()
  const [state, setState] = useState<AppState>(INITIAL)
  const [hydrated, setHydrated] = useState(false)
  const [pwa, setPwa] = useState<PwaState>({ offline: 'checking', cached: 0, total: 0, installed: false, updateReady: false })
  const [storageError, setStorageError] = useState('')
  const [toast, setToast] = useState('')
  const [zoom, setZoom] = useState<{ lesson?: Lesson; drill?: Drill; kind: 'overview' | 'sequence' | 'compare' | 'detail' | 'layout' } | null>(null)
  const [planDraft, setPlanDraft] = useState<WorkoutPlan | null>(null)

  useEffect(() => {
    readState(INITIAL).then((value) => {
      setState({ ...INITIAL, ...value, profile: { ...INITIAL.profile, ...value.profile }, sessions: Array.isArray(value.sessions) ? value.sessions : [] })
      setHydrated(true)
      if (value.activeSession && value.activeSession.status === 'running') {
        const persisted = value.activeSession
        const lock = getLiveSessionLock()
        const otherTabOwnsSession = Boolean(lock && lock.owner !== TAB_ID)
        const elapsedWhileOpen = persisted.blockStartedAt ? Math.floor((Date.now() - persisted.blockStartedAt) / 1000) : 0
        setState((current) => ({ ...current, activeSession: { ...persisted, status: 'paused', blockElapsedSeconds: otherTabOwnsSession ? persisted.blockElapsedSeconds : Math.min(persisted.plan.blocks[persisted.currentIndex]?.duration ?? 0, persisted.blockElapsedSeconds + elapsedWhileOpen), blockStartedAt: null } }))
        if (!otherTabOwnsSession) releaseSessionLock()
      }
    }).catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : 'ブラウザ内の記録を読み込めませんでした。')
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const save = window.setTimeout(() => {
      saveState(state).then(() => setStorageError('')).catch((error: unknown) => setStorageError(error instanceof Error ? error.message : '練習記録を保存できませんでした。'))
    }, 250)
    return () => clearTimeout(save)
  }, [state, hydrated])

  useEffect(() => startPwa(setPwa), [])

  useEffect(() => {
    if (route.page === 'run') return
    setState((current) => {
      const active = current.activeSession
      if (!active || active.status !== 'running') return current
      const elapsed = active.blockStartedAt ? Math.max(0, Math.floor((Date.now() - active.blockStartedAt) / 1000)) : 0
      return { ...current, activeSession: { ...active, status: 'paused', blockStartedAt: null, blockElapsedSeconds: Math.min(active.plan.blocks[active.currentIndex]?.duration ?? 0, active.blockElapsedSeconds + elapsed) } }
    })
  }, [route.page])
  useEffect(() => {
    const active = state.activeSession
    if (!active || active.status !== 'running') return
    const lock = getLiveSessionLock()
    if (lock && lock.owner !== TAB_ID && lock.sessionId === active.id) {
      setState((current) => {
        if (current.activeSession?.id !== active.id || current.activeSession.status !== 'running') return current
        const running = current.activeSession
        const elapsed = running.blockStartedAt ? Math.max(0, Math.floor((Date.now() - running.blockStartedAt) / 1000)) : 0
        return { ...current, activeSession: { ...running, status: 'paused', blockStartedAt: null, blockElapsedSeconds: Math.min(running.plan.blocks[running.currentIndex]?.duration ?? 0, running.blockElapsedSeconds + elapsed) } }
      })
    }
    const interval = window.setInterval(() => {
      setState((current) => {
        const running = current.activeSession
        if (!running || running.id !== active.id || running.status !== 'running' || !running.blockStartedAt) return current
        const block = running.plan.blocks[running.currentIndex]
        if (!block) return current
        const elapsed = Math.min(block.duration, running.blockElapsedSeconds + Math.max(0, Math.floor((Date.now() - running.blockStartedAt) / 1000)))
        if (elapsed >= block.duration) return { ...current, activeSession: { ...running, status: 'paused', blockStartedAt: null, blockElapsedSeconds: block.duration } }
        if (Math.floor(elapsed / 5) > Math.floor(running.blockElapsedSeconds / 5)) return { ...current, activeSession: { ...running, blockElapsedSeconds: elapsed, blockStartedAt: Date.now() } }
        return current
      })
    }, 1000)
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return
      setState((current) => {
        const running = current.activeSession
        if (!running || running.id !== active.id || running.status !== 'running') return current
        const elapsed = running.blockStartedAt ? Math.floor((Date.now() - running.blockStartedAt) / 1000) : 0
        const duration = running.plan.blocks[running.currentIndex]?.duration ?? 0
        return { ...current, activeSession: { ...running, status: 'paused', blockStartedAt: null, blockElapsedSeconds: Math.min(duration, running.blockElapsedSeconds + Math.max(0, elapsed)) } }
      })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [state.activeSession?.id, state.activeSession?.status, state.activeSession?.currentIndex, state.activeSession?.blockStartedAt, state.activeSession?.blockElapsedSeconds])

  const open = useCallback((page: string) => routeTo(page), [routeTo])
  const activeTab = navigation.some((item) => item.page === route.page) ? route.page : ['lesson', 'learn'].includes(route.page) ? 'learn' : ['drill', 'plan', 'run', 'review'].includes(route.page) ? 'practice' : route.page.startsWith('history') ? 'history' : 'home'

  const startWorkout = (plan: WorkoutPlan) => {
    if (state.activeSession) {
      setToast('一時停止中の練習を続けるか、練習画面から終了してから新しい練習を始めてください。')
      return
    }
    const lockId = crypto.randomUUID()
    if (!claimSessionLock(lockId)) {
      setToast('別のタブで練習中です。そちらを閉じてから再開してください。')
      return
    }
    const firstBlock = plan.blocks[0]
    const active: ActiveSession = { id: lockId, plan, startedAt: Date.now(), currentIndex: 0, blockElapsedSeconds: 0, blockStartedAt: Date.now(), status: 'running', completedIndices: [], skippedIndices: [], achievements: {} }
    if (!firstBlock) return
    setState((current) => ({ ...current, activeSession: active }))
    routeTo('run')
  }

  const startQuickDrill = (drill: Drill) => {
    const missing = drill.equipment.some((item) => item === 'ラケット' && !state.profile.hasRacket || item === '球' && !state.profile.hasBall)
    if (drill.environment.includes('solo') && !state.profile.hasRacket || missing) {
      setToast('必要な道具がありません。設定で持ち物を変更できます。')
      open('settings')
      return
    }
    const plan: WorkoutPlan = {
      id: drill.id, title: drill.title,
      environment: drill.environment.includes('home') ? 'home' : drill.environment.includes('partner') ? 'partner' : 'solo',
      minutes: drill.duration, level: drill.level, goal: state.profile.goal,
      reason: 'ひとつの練習に、自分のペースで取り組みます。',
      blocks: [
        { id: `${drill.id}-prepare`, phase: 'warmup', title: '準備と安全の確認', duration: 30, detail: '足元と周りの安全を確認します。' },
        { id: `${drill.id}-exercise`, phase: 'drill', title: drill.title, duration: drill.duration * 60 - 60, drillId: drill.id, detail: drill.summary, cue: drill.cue },
        { id: `${drill.id}-reflect`, phase: 'cooldown', title: '整理運動・振り返り', duration: 30, detail: '呼吸を整え、今日の感覚を振り返ります。' },
      ],
    }
    startWorkout(plan)
  }

  const confirmPlan = (plan: WorkoutPlan) => {
    setPlanDraft(plan)
    go(`plan/${plan.id}-${plan.environment}-${plan.minutes}`)
  }

  const openZoomLesson = (lesson: Lesson, kind: 'overview' | 'sequence' | 'compare' | 'detail' = 'overview') => setZoom({ lesson, kind })
  const openZoomDrill = (drill: Drill) => setZoom({ drill, kind: 'layout' })
  const showHome = route.page === 'home'
  const isRunning = route.page === 'run' && Boolean(state.activeSession)
  const currentLesson = route.page === 'lesson' ? lessonById(route.id ?? '') : undefined
  const currentDrill = route.page === 'drill' ? drillById(route.id ?? '') : undefined
  const chosenPlan = route.page === 'plan' ? (() => {
    const match = (route.id ?? '').match(/^(P\d+)-(home|solo|partner)-(15|30|60)$/)
    if (!match) return null
    const environment = match[2] as TrainingEnvironment
    const minutes = Number(match[3])
    if (planDraft?.id === match[1] && planDraft.environment === environment && planDraft.minutes === minutes && planDraft.goal === state.profile.goal) return planDraft
    return buildPlan(state.profile, environment, minutes, state.profile.goal)
  })() : null
  const historyItem = route.page === 'history' && route.id ? state.sessions.find((session) => session.id === route.id) : undefined
  const handleInstall = async () => {
    const result = await installPwa()
    if (result === 'manual') open('install')
    else if (result === 'accepted') setToast('ホーム画面への追加を開始しました。')
    else setToast('ホーム画面への追加はいつでもできます。')
  }
  const retrySave = () => saveState(state).then(() => setStorageError('')).catch((error: unknown) => setStorageError(error instanceof Error ? error.message : '保存に失敗しました。'))

  if (!hydrated) return <div className="boot-screen"><img src={`${import.meta.env.BASE_URL}pingpong.svg`} alt="" /><span className="boot-screen__wordmark">PINGPONG</span><span>練習ノートをひらいています…</span></div>
  if (isRunning && state.activeSession) return <><ActiveWorkout session={state.activeSession} state={state} setState={setState} />{toast && <ProgressToast message={toast} close={() => setToast('')} />}</>

  return <div className="app-frame">
    <Sidebar active={activeTab} open={open} />
    <div className="app-main"><Topbar route={route} state={state} pwa={pwa} open={open} onInstall={() => void handleInstall()} /><main id="main-content" className="app-content">
      {storageError && <div className="storage-error" role="alert"><Info size={16} /><span>ブラウザ内保存を確認してください：{storageError}</span><button onClick={() => void retrySave()}>再試行</button><button aria-label="閉じる" onClick={() => setStorageError('')}><X size={15} /></button></div>}
      {state.activeSession?.status === 'paused' && route.page !== 'review' && <button className="resume-banner" onClick={() => { if (!claimSessionLock(state.activeSession!.id)) { setToast('別のタブで練習中です。'); return } setState((current) => ({ ...current, activeSession: current.activeSession ? { ...current.activeSession, status: 'running', blockStartedAt: Date.now() } : null })); go('run') }}><span className="resume-banner__icon"><Play size={16} fill="currentColor" /></span><span><b>一時停止中の練習があります</b><small>{state.activeSession.plan.title} · 続きから再開できます</small></span><ArrowRight size={17} /></button>}
      {showHome && <HomeScreen state={state} setState={setState} open={open} onDiagram={openZoomLesson} />}
      {route.page === 'learn' && <LearningScreen state={state} setState={setState} onDiagram={openZoomLesson} />}
      {route.page === 'lesson' && (currentLesson ? <LessonScreen lesson={currentLesson} state={state} setState={setState} open={open} onDiagram={openZoomLesson} /> : <MissingContent open={open} />)}
      {route.page === 'practice' && <PracticeScreen state={state} setState={setState} open={open} onConfirm={confirmPlan} />}
      {route.page === 'plan' && <PlanConfirmScreen plan={chosenPlan} state={state} start={startWorkout} open={open} />}
      {route.page === 'drill' && (currentDrill ? <DrillScreen drill={currentDrill} state={state} setState={setState} open={open} startQuick={startQuickDrill} onDiagram={openZoomDrill} /> : <MissingContent open={open} />)}
      {route.page === 'history' && (route.id ? <HistoryDetail session={historyItem} setState={setState} open={open} /> : <HistoryScreen state={state} setState={setState} open={open} />)}
      {route.page === 'review' && <ReviewScreen state={state} setState={setState} open={open} />}
      {route.page === 'settings' && <SettingsScreen state={state} setState={setState} pwa={pwa} open={open} />}
      {route.page === 'install' && <InstallScreen pwa={pwa} open={open} />}
      {!['home', 'learn', 'lesson', 'practice', 'plan', 'drill', 'history', 'review', 'settings', 'install', 'run'].includes(route.page) && <MissingContent open={open} />}
    </main><footer className="site-footer"><span>やさしく、少しずつ。 <b>🏓</b></span><span>この練習の記録は、あなたのブラウザに保存されます。</span><button onClick={() => open('install')}>オフラインとホーム画面 <ArrowRight size={13} /></button></footer></div>
    <NavBottom active={activeTab} open={open} />
    {!navigator.onLine && <div className="offline-toast"><CloudOff size={15} /><span>{pwa.offline === 'ready' ? '保存済みの教材を使っています' : 'オフラインの準備がまだ完了していません'}</span></div>}
    {pwa.updateReady && state.activeSession?.status !== 'running' && <div className="update-banner"><span>新しい版があります。練習記録はそのまま引き継がれます。</span><button onClick={() => void applyUpdate()}>更新する <RotateCcw size={14} /></button></div>}
    {toast && <ProgressToast message={toast} close={() => setToast('')} />}
    {zoom && <ZoomModal lesson={zoom.lesson} drill={zoom.drill} kind={zoom.kind} hand={state.profile.hand} close={() => setZoom(null)} />}
  </div>
}

function MissingContent({ open }: { open: (page: string) => void }) {
  return <div className="page-shell"><EmptyState icon={BookOpen} title="教材が見つかりませんでした" detail="URLか練習一覧を確認してください。" action="ホームへ戻る" onAction={() => open('home')} /></div>
}

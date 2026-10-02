import { useId } from 'react'
import type { Drill, Lesson, PlayingHand } from './types'

interface SceneProps {
  lesson?: Lesson
  drill?: Drill
  kind?: 'overview' | 'sequence' | 'compare' | 'detail' | 'layout'
  hand?: PlayingHand
  step?: number
  compact?: boolean
}

const accent: Record<string, string> = {
  grip: '#a96a4b', stance: '#73b89a', footwork: '#f08d64', forehand: '#f08d64',
  backhand: '#84b7bc', drive: '#ee7657', push: '#9bba83', block: '#7cad97',
  serve: '#f1b35c', spin: '#4faeb1', knuckle: '#8ca79e', receive: '#efa269',
  course: '#ee8164', rally: '#74b69a', solo: '#73b89a', targets: '#f08b69',
  route: '#85b3a5', receiveDrill: '#ebb068',
}

const skillName = (lesson?: Lesson, drill?: Drill) => lesson?.title ?? drill?.title ?? '卓球の練習'

function Marker({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse">
        <path d="M0 0 8 4 0 8Z" fill="#e47755" />
      </marker>
      <marker id={`${id}-green`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse">
        <path d="M0 0 8 4 0 8Z" fill="#327f63" />
      </marker>
      <linearGradient id={`${id}-shirt`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#a8d5b7" />
        <stop offset="1" stopColor="#79b58f" />
      </linearGradient>
      <linearGradient id={`${id}-table`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#33796a" />
        <stop offset="1" stopColor="#255c53" />
      </linearGradient>
    </defs>
  )
}

function Table({ id, x = 305, y = 136, width = 240, height = 100, top = false }: { id: string; x?: number; y?: number; width?: number; height?: number; top?: boolean }) {
  if (top) {
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} rx="12" fill={`url(#${id}-table)`} stroke="#174c43" strokeWidth="4" />
        <path d={`M${x} ${y + height / 2}h${width}`} stroke="#e4efe6" strokeWidth="3" strokeDasharray="6 6" />
        <path d={`M${x + width / 2} ${y}v${height}`} stroke="#e4efe6" strokeWidth="3" />
        <path d={`M${x + 13} ${y + 13}h${width - 26}v${height - 26}h-${width - 26}z`} fill="none" stroke="#d8e9df" strokeWidth="1.5" opacity=".8" />
      </g>
    )
  }
  return (
    <g>
      <path d={`M${x} ${y}h${width}l19 112H${x - 19}Z`} fill={`url(#${id}-table)`} stroke="#174c43" strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${x + width / 2} ${y + 2}v50`} stroke="#e1eee3" strokeWidth="3" />
      <path d={`M${x - 9} ${y - 9}h${width + 18}v12H${x - 9}Z`} fill="#e9eee2" stroke="#cbd8cf" strokeWidth="2" />
      <path d={`M${x + width / 2} ${y - 9}v12`} stroke="#afbeb4" strokeWidth="2" />
      <path d={`M${x + 23} ${y + 112}l-6 29m${width - 40} -29 7 29`} stroke="#51645d" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x - 25} ${y + 143}h${width + 50}`} stroke="#536860" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

function Player({ id, x = 150, y = 246, hand = 'right', phase = 2, small = false, wrong = false }: { id: string; x?: number; y?: number; hand?: PlayingHand; phase?: number; small?: boolean; wrong?: boolean }) {
  const flip = hand === 'left' ? -1 : 1
  const scale = small ? 0.64 : 1
  const size = scale
  const swing = phase === 2 ? 1 : phase === 1 ? 0.55 : phase === 3 ? 0.22 : 0.05
  const lean = wrong ? -17 : phase === 2 ? 2 : phase === 1 ? -6 : 0
  const shoulder = y - 96 * size
  const hip = y - 39 * size
  const handX = x + flip * (31 + 38 * swing) * size
  const handY = shoulder + (phase === 1 ? 8 : phase === 3 ? 12 : 2) * size
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={x + 3 * size} cy={y + 3 * size} rx={42 * size} ry={7 * size} fill="#385f53" opacity=".13" />
      <path d={`M${x - 15 * size} ${hip} ${x - 24 * size} ${y - 20 * size} ${x - 43 * size} ${y}`} fill="none" stroke="#557569" strokeWidth={9 * size} />
      <path d={`M${x + 12 * size} ${hip} ${x + 22 * size} ${y - 18 * size} ${x + 44 * size} ${y}`} fill="none" stroke="#355f52" strokeWidth={10 * size} />
      <path d={`M${x - 43 * size} ${y}l-12 ${small ? 0 : 0}m${x + 44 * size - (x - 43 * size)} 0l14 0`} stroke="#345347" strokeWidth={7 * size} />
      <path d={`M${x - 24 * size} ${y - 111 * size}q23 ${-14 * size} 49 0l-5 ${61 * size}q-22 ${14 * size} -43 0Z`} transform={`rotate(${lean * flip} ${x} ${hip})`} fill={`url(#${id}-shirt)`} stroke="#4a8065" strokeWidth={2 * size} />
      <path d={`M${x - 13 * size} ${y - 51 * size}q15 ${10 * size} 31 0`} fill="none" stroke="#63836d" strokeWidth={3 * size} />
      <circle cx={x} cy={y - 125 * size} r={15 * size} fill="#f1c6a4" stroke="#9e705d" strokeWidth={2 * size} />
      <path d={`M${x - 15 * size} ${y - 130 * size}q3 ${-20 * size} 25 ${-11 * size}q6 ${4 * size} 6 ${12 * size}q-12 ${-8 * size} -31 ${-1 * size}`} fill="#395549" />
      <path d={`M${x - 18 * size} ${shoulder + 4 * size}L${x + flip * 14 * size} ${shoulder + 23 * size}L${handX} ${handY}`} fill="none" stroke="#f1c6a4" strokeWidth={9 * size} />
      {flip === 1 ? <path d={`M${x + 13 * size} ${shoulder + 25 * size}L${x + 31 * size} ${hip + 2 * size}`} fill="none" stroke="#f1c6a4" strokeWidth={9 * size} /> : <path d={`M${x - 13 * size} ${shoulder + 25 * size}L${x - 31 * size} ${hip + 2 * size}`} fill="none" stroke="#f1c6a4" strokeWidth={9 * size} />}
      <circle cx={handX} cy={handY} r={5 * size} fill="#df9f7a" />
      <path d={`M${handX} ${handY}l${flip * 21 * swing * size} ${-19 * swing * size}l${flip * 10 * size} ${-14 * size}`} fill="none" stroke="#315c4e" strokeWidth={5 * size} />
      <g transform={`translate(${handX + flip * (37 * swing + 11) * size} ${handY - 31 * swing * size}) rotate(${flip * (-24 + swing * 36)} )`}>
        <ellipse cx="0" cy="-11" rx={12 * size} ry={17 * size} fill={wrong ? '#d8765e' : '#347f63'} stroke="#224b41" strokeWidth={2 * size} />
        <path d={`M-2 4v${21 * size}`} stroke="#ad744b" strokeWidth={6 * size} />
        <ellipse cx="0" cy="-11" rx={6 * size} ry={10 * size} fill="#b4d3a4" opacity=".9" />
      </g>
    </g>
  )
}

function Ball({ x = 316, y = 151, id = 'ball', rotation = false }: { x?: number; y?: number; id?: string; rotation?: boolean }) {
  return (
    <g>
      {rotation && <path d={`M${x - 17} ${y - 22}q-25 9 -9 28m19 17q28 -11 10 -28`} fill="none" stroke="#ef8a56" strokeWidth="3" strokeLinecap="round" markerStart={`url(#${id})`} markerEnd={`url(#${id})`} />}
      <circle cx={x} cy={y} r="7" fill="#ef975b" stroke="#fff9ef" strokeWidth="2" />
    </g>
  )
}

function SkillScene({ id, lesson, hand, phase = 2 }: { id: string; lesson: Lesson; hand: PlayingHand; phase?: number }) {
  const focused = lesson.visual
  if (focused === 'grip') {
    return (
      <g>
        <rect x="319" y="102" width="109" height="135" rx="49" fill="#fff1e4" stroke="#edddcd" strokeWidth="2" />
        <ellipse cx="370" cy="150" rx="24" ry="40" fill="#eeb993" stroke="#c58968" strokeWidth="2" />
        <path d="M338 142q31 -18 64 1M338 158q31 -18 64 1M341 174q28 -15 58 0" fill="none" stroke="#c58968" strokeWidth="6" strokeLinecap="round" />
        <g transform="rotate(-32 358 163)">
          <ellipse cx="358" cy="130" rx="28" ry="41" fill="#347f63" stroke="#224b41" strokeWidth="4" />
          <ellipse cx="358" cy="130" rx="18" ry="29" fill="#aacaa3" />
          <path d="M358 168v60" stroke="#a8714d" strokeWidth="13" />
        </g>
        <path d="M198 141h86" stroke="#2d7460" strokeWidth="2" markerEnd={`url(#${id}-green)`} />
        <text x="198" y="122" className="svg-label">手の力を抜く</text>
        <text x="384" y="243" className="svg-small">柄は手の中へ</text>
        <circle cx="351" cy="132" r="6" fill="#f08d64" />
      </g>
    )
  }
  if (focused === 'serve' || focused === 'spin' || focused === 'knuckle') {
    return (
      <g>
        <Table id={id} x={286} y={191} width={220} />
        <Player id={id} x={176} y={268} hand={hand} phase={phase} small />
        <path d="M177 135V64" stroke="#e47755" strokeWidth="3" strokeDasharray="6 7" markerEnd={`url(#${id})`} />
        <path d="M166 64h22m-11-8v16" stroke="#315e4f" strokeWidth="2" strokeLinecap="round" />
        <Ball x={177} y={99} id={id} rotation={focused === 'spin'} />
        <path d="M217 160q54 -42 127 11" fill="none" stroke="#e47755" strokeWidth="3" strokeDasharray="6 7" markerEnd={`url(#${id})`} />
        <path d="M452 178q30 -5 51 11" fill="none" stroke="#63af8b" strokeWidth="2" markerEnd={`url(#${id}-green)`} />
        <text x="78" y="57" className="svg-label">高く、ほぼ垂直に</text>
        <text x="370" y="242" className="svg-small">自分側 → 相手側</text>
        <rect x="80" y="284" width="168" height="27" rx="12" fill="#ffffff" opacity=".82" />
        <text x="95" y="302" className="svg-small">球が見える位置で打つ</text>
      </g>
    )
  }
  if (focused === 'receive' || focused === 'course' || focused === 'rally') {
    return (
      <g>
        <Table id={id} x={226} y={66} width={255} height={201} top />
        <ellipse cx="353" cy="113" rx="63" ry="35" fill="#f7ba79" opacity=".44" stroke="#da8c58" strokeWidth="2" strokeDasharray="6 5" />
        <ellipse cx="355" cy="232" rx="78" ry="30" fill="#b4dbad" opacity=".55" stroke="#68a77e" strokeWidth="2" strokeDasharray="5 5" />
        <circle cx="176" cy="163" r="19" fill="#a3cfad" stroke="#468665" strokeWidth="3" />
        <circle cx="528" cy="163" r="19" fill="#f1c6a4" stroke="#ad795f" strokeWidth="3" />
        <path d="M198 150q63 -54 122 -32m10 89q61 40 109 1" fill="none" stroke="#e47755" strokeWidth="3" markerEnd={`url(#${id})`} />
        <text x="319" y="105" className="svg-small">短いゾーン</text>
        <text x="321" y="237" className="svg-small">深いゾーン</text>
        <text x="81" y="124" className="svg-label">見てから選ぶ</text>
        <path d="M140 131q34 10 52 22" fill="none" stroke="#327f63" strokeWidth="2" markerEnd={`url(#${id}-green)`} />
      </g>
    )
  }
  return (
    <g>
      <Table id={id} />
      <Player id={id} x={148} y={273} hand={hand} phase={phase} />
      <path d={`M176 153q46 -48 135 -7`} fill="none" stroke="#e47755" strokeWidth="3" strokeDasharray="7 6" markerEnd={`url(#${id})`} />
      <Ball id={id} x={291} y={146} rotation={focused === 'drive'} />
      <path d={`M210 287q66 27 146 -9`} fill="none" stroke="#63aa84" strokeWidth="2" markerEnd={`url(#${id}-green)`} />
      <ellipse cx="335" cy="149" rx="20" ry="14" fill="#ed895a" opacity=".12" />
      <circle cx="335" cy="149" r="10" fill="none" stroke="#ed895a" strokeWidth="2" strokeDasharray="3 3" />
      <text x="272" y="125" className="svg-label">体の前で打つ</text>
      <text x="306" y="292" className="svg-small">打ったら戻る</text>
      {focused === 'block' && <text x="396" y="114" className="svg-small">短く合わせる</text>}
      {focused === 'push' && <text x="394" y="113" className="svg-small">小さく送り出す</text>}
      {focused === 'footwork' && <path d="M206 287q-12 19 -24 0m54 6q-12 19 -24 0" fill="none" stroke="#3b8a6b" strokeWidth="3" />}
      {focused === 'stance' && <path d="M116 278h64" stroke="#347f63" strokeWidth="2" strokeDasharray="5 4" />}
    </g>
  )
}

function DrillScene({ id, drill, hand }: { id: string; drill: Drill; hand: PlayingHand }) {
  const hasPartner = drill.environment.includes('partner')
  if (drill.diagram === 'targets') {
    return (
      <g>
        <Table id={id} x={202} y={70} width={281} height={205} top />
        <rect x="211" y="79" width="125" height="86" rx="10" fill="#f7b47c" opacity=".58" />
        <rect x="352" y="181" width="119" height="84" rx="10" fill="#f7d17d" opacity=".55" />
        <text x="235" y="126" className="svg-label">クロス</text>
        <text x="374" y="227" className="svg-label">狙う場所</text>
        <path d="M143 219Q260 132 402 221" fill="none" stroke="#e47755" strokeWidth="4" strokeDasharray="7 6" markerEnd={`url(#${id})`} />
        <circle cx="409" cy="219" r="8" fill="#ef975b" />
        <text x="80" y="188" className="svg-small">10球から記録</text>
      </g>
    )
  }
  if (drill.diagram === 'route' || drill.diagram === 'receive') {
    return (
      <g>
        <Table id={id} x={216} y={71} width={270} height={202} top />
        <circle cx="179" cy="165" r="19" fill="#9dcbaa" stroke="#438261" strokeWidth="3" />
        {hasPartner && <circle cx="524" cy="165" r="19" fill="#efc2a0" stroke="#b67c61" strokeWidth="3" />}
        <path d="M197 154q55 -54 106 -28" fill="none" stroke="#ed805c" strokeWidth="3" strokeDasharray="6 5" markerEnd={`url(#${id})`} />
        {drill.diagram === 'route' ? (
          <path d="M393 197q50 18 80 -14" fill="none" stroke="#40886a" strokeWidth="3" markerEnd={`url(#${id}-green)`} />
        ) : (
          <path d="M492 130q-49 -28 -93 1" fill="none" stroke="#40886a" strokeWidth="3" markerEnd={`url(#${id}-green)`} />
        )}
        <text x="240" y="310" className="svg-small">足で移動 → 打球 → 構えに戻る</text>
      </g>
    )
  }
  if (drill.diagram === 'serve') {
    return (
      <g>
        <Table id={id} x={263} y={187} width={240} />
        <Player id={id} x={159} y={263} hand={hand} phase={2} small />
        <path d="M151 139v-67" stroke="#e47755" strokeWidth="3" strokeDasharray="5 5" markerEnd={`url(#${id})`} />
        <Ball x={151} y={107} id={id} rotation={drill.id === 'D15'} />
        <path d="M198 175q54 -42 120 9" fill="none" stroke="#55a47b" strokeWidth="3" markerEnd={`url(#${id}-green)`} />
        <text x="70" y="64" className="svg-label">同じトスから</text>
        <text x="359" y="235" className="svg-small">10球の長さを観察</text>
      </g>
    )
  }
  if (drill.diagram === 'solo') {
    return (
      <g>
        <Player id={id} x={215} y={253} hand={hand} phase={2} />
        <circle cx="384" cy="205" r="21" fill="#fff3e2" stroke="#e6bd89" strokeWidth="2" />
        <circle cx="384" cy="205" r="8" fill="#eb9259" />
        <path d="M281 218q44 -44 79 -13" fill="none" stroke="#e47755" strokeWidth="3" markerEnd={`url(#${id})`} />
        <path d="M346 185q-30 -55 7 -79" fill="none" stroke="#337f63" strokeWidth="2" strokeDasharray="5 5" markerEnd={`url(#${id}-green)`} />
        <text x="338" y="87" className="svg-label">ゆっくり・小さく</text>
        <text x="89" y="300" className="svg-small">球が落ちたら拾って再開</text>
      </g>
    )
  }
  return (
    <g>
      <Table id={id} />
      <Player id={id} x={146} y={267} hand={hand} phase={2} />
      {hasPartner && <circle cx="533" cy="133" r="20" fill="#edc1a1" stroke="#ae785e" strokeWidth="3" />}
      <path d={hasPartner ? 'M501 147q-71 52 -202 2' : 'M209 169q62 -48 133 3'} fill="none" stroke="#e47755" strokeWidth="4" strokeDasharray="7 6" markerEnd={`url(#${id})`} />
      <Ball id={id} x={hasPartner ? 301 : 339} y={hasPartner ? 163 : 166} />
      <path d="M250 288h100" stroke="#347f63" strokeWidth="3" strokeDasharray="5 5" />
      <text x="272" y="313" className="svg-small">自分の目標をひとつ記録</text>
    </g>
  )
}

export function Illustration({ lesson, drill, kind = 'overview', hand = 'right', step = 2, compact = false }: SceneProps) {
  const uid = useId().replace(/:/g, '')
  const visual = lesson?.visual ?? drill?.diagram ?? 'solo'
  const tint = accent[visual] ?? '#81b59a'
  const label = skillName(lesson, drill)
  const titles = {
    overview: 'ポイントを図で確認', sequence: '動きを4つに分けて',
    compare: 'よくある間違いとコツ', detail: '打球と動きの向き', layout: '練習の配置イメージ',
  }
  const inSequence = lesson ? lesson.steps[Math.min(Math.max(step, 0), 3)] : null
  return (
    <div className={`illustration illustration--${kind}${compact ? ' illustration--compact' : ''}`}>
      <div className="illustration__caption"><span>{titles[kind]}</span><span className="illustration__hand">{hand === 'right' ? '↗' : '↖'} {hand === 'right' ? '右利き' : '左利き'}</span></div>
      <svg viewBox="0 0 600 340" role="img" aria-label={`${label}の学習図。${lesson?.focus ?? drill?.cue ?? 'ラケット・足・球の動きと練習場所を示します。'}`}>
        <Marker id={uid} />
        <rect x="0" y="0" width="600" height="340" rx="24" fill="#edf4eb" />
        <circle cx="527" cy="46" r="85" fill={tint} opacity=".1" />
        <circle cx="51" cy="312" r="71" fill="#dfebdf" opacity=".62" />
        {kind === 'sequence' && lesson ? (
          lesson.steps.map((item, index) => {
            const x = index % 2 === 0 ? 20 : 308
            const y = index < 2 ? 25 : 177
            return (
              <g key={item.label}>
                <rect x={x} y={y} width="270" height="137" rx="16" fill="#ffffff" opacity=".86" />
                <circle cx={x + 25} cy={y + 25} r="14" fill={index === step ? '#e77755' : '#e7f0e5'} />
                <text x={x + 25} y={y + 30} textAnchor="middle" className="svg-number" fill={index === step ? 'white' : '#526c5e'}>{index + 1}</text>
                <Player id={uid} x={x + 93} y={y + 118} hand={hand} phase={index} small />
                <path d={`M${x + 114} ${y + 72}q31 -22 55 -3`} fill="none" stroke={index === step ? '#df7956' : '#5c9979'} strokeWidth="2" strokeDasharray="4 3" markerEnd={`url(#${uid})`} />
                <Ball id={uid} x={x + 187} y={y + 63} />
                <text x={x + 180} y={y + 106} className="svg-label">{item.label}</text>
                <text x={x + 180} y={y + 123} className="svg-small">{item.title}</text>
              </g>
            )
          })
        ) : kind === 'compare' && lesson ? (
          <g>
            <rect x="22" y="25" width="266" height="289" rx="20" fill="#fff7f4" />
            <rect x="310" y="25" width="266" height="289" rx="20" fill="#f8fff7" />
            <rect x="39" y="39" width="72" height="27" rx="12" fill="#f7ded5" />
            <text x="57" y="57" className="svg-small">避けたい</text>
            <rect x="326" y="39" width="72" height="27" rx="12" fill="#dff0df" />
            <text x="343" y="57" className="svg-small">こうしよう</text>
            <Player id={uid} x={98} y={273} hand={hand} phase={1} wrong />
            <Player id={uid} x={389} y={273} hand={hand} phase={2} />
            <path d="M104 213q40 -46 85 -22" fill="none" stroke="#d78371" strokeWidth="3" strokeDasharray="5 5" markerEnd={`url(#${uid})`} />
            <path d="M395 199q51 -40 98 -3" fill="none" stroke="#64a382" strokeWidth="3" markerEnd={`url(#${uid}-green)`} />
            <text x="39" y="301" className="svg-small">{lesson.mistake.slice(0, 16)}</text>
            <text x="326" y="301" className="svg-small">{lesson.better.slice(0, 16)}</text>
          </g>
        ) : kind === 'detail' && lesson ? (
          <g>
            <g transform="translate(272 46) rotate(30)">
              <ellipse cx="62" cy="98" rx="53" ry="70" fill="#397f64" stroke="#1d5545" strokeWidth="5" />
              <ellipse cx="62" cy="98" rx="35" ry="52" fill="#b1d1a9" />
              <path d="M62 166v97" stroke="#a77551" strokeWidth="22" strokeLinecap="round" />
            </g>
            <Ball x={236} y={150} id={uid} rotation={lesson.visual === 'spin' || lesson.visual === 'drive'} />
            <path d="M178 205q29 -45 52 -49" fill="none" stroke="#e47755" strokeWidth="3" markerEnd={`url(#${uid})`} />
            <path d="M406 112q29 18 26 52m-43 27q-30 3 -46 -22" fill="none" stroke="#328168" strokeWidth="3" strokeDasharray="6 4" markerEnd={`url(#${uid}-green)`} />
            <rect x="60" y="79" width="130" height="34" rx="16" fill="white" opacity=".9" />
            <text x="77" y="101" className="svg-label">{lesson.visual === 'serve' ? '高さを確認' : '体の前で打つ'}</text>
            <path d="M177 119l64 26" stroke="#718c7b" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="392" y="252" className="svg-small">球の回転・高さで
              <tspan x="392" dy="17">面は少しずつ調整</tspan>
            </text>
            <circle cx="238" cy="151" r="17" fill="none" stroke="#ef925b" strokeWidth="2" strokeDasharray="4 4" />
          </g>
        ) : kind === 'layout' && drill ? (
          <DrillScene id={uid} drill={drill} hand={hand} />
        ) : lesson ? (
          <SkillScene id={uid} lesson={lesson} hand={hand} phase={step} />
        ) : drill ? (
          <DrillScene id={uid} drill={drill} hand={hand} />
        ) : null}
        <rect x="420" y="283" width="150" height="32" rx="15" fill="#ffffff" opacity=".84" />
        <text x="440" y="304" className="svg-tiny">{inSequence ? `${inSequence.label} · ${inSequence.title}` : lesson?.focus.slice(0, 13) ?? drill?.cue.slice(0, 17)}</text>
      </svg>
      <p className="illustration__note">{lesson ? lesson.focus : drill?.cue}</p>
    </div>
  )
}

export function HeroTableArt() {
  return (
    <svg className="hero-table-art" viewBox="0 0 650 460" role="img" aria-label="卓球台と練習する選手、ボールの動きを描いたイラスト">
      <defs>
        <linearGradient id="hero-table" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5eb695" /><stop offset="1" stopColor="#287765" /></linearGradient>
        <linearGradient id="hero-player" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4c59f" /><stop offset="1" stopColor="#d59a79" /></linearGradient>
      </defs>
      <path d="M25 403h597" stroke="#a5c6ae" strokeWidth="2" opacity=".48" />
      <circle cx="100" cy="113" r="67" fill="#acd8af" opacity=".14" />
      <circle cx="541" cy="85" r="43" fill="#f0b56e" opacity=".12" />
      <path d="M130 229h393l57 105H73Z" fill="url(#hero-table)" stroke="#e3f0dc" strokeWidth="3" strokeLinejoin="round" />
      <path d="m130 229-9 10h420l-18-10" fill="#f7f3e8" opacity=".96" />
      <path d="M326 231v54" stroke="#e4f1dd" strokeWidth="3" />
      <path d="m115 333-4 84m445-84 5 84M111 416h77m363 0h77" stroke="#d4e4d6" strokeWidth="9" strokeLinecap="round" />
      <path d="M325 219V290" stroke="#deede1" strokeWidth="5" />
      <path d="M314 219h22" stroke="#eff3e5" strokeWidth="6" />
      <path d="m213 359q77 -81 164 -29t130 -23" fill="none" stroke="#edb176" strokeWidth="4" strokeDasharray="8 10" />
      <circle cx="333" cy="301" r="8" fill="#efaa68" stroke="#fff3dd" strokeWidth="3" />
      <g transform="translate(419 79)">
        <ellipse cx="4" cy="12" rx="28" ry="35" fill="#543b31" />
        <path d="M-24 11q7 -33 30 -19 23 -1 25 23-24 -11 -54 -4" fill="#e2b27f" />
        <path d="M-24 48q28 -19 56 2l12 111h-83Z" fill="#d8ead5" />
        <path d="m-41 61-28 56m93-57 28 34" stroke="url(#hero-player)" strokeWidth="18" strokeLinecap="round" />
        <path d="m-27 158-18 101m54-99 30 90" stroke="#a5ccab" strokeWidth="23" strokeLinecap="round" />
        <path d="m-45 259-24 13m108-15 23 12" stroke="#edeee3" strokeWidth="13" strokeLinecap="round" />
        <g transform="translate(98 91) rotate(35)">
          <ellipse rx="17" ry="25" fill="#f5bc78" stroke="#fff0df" strokeWidth="3" />
          <path d="M0 22v32" stroke="#c7885f" strokeWidth="10" strokeLinecap="round" />
        </g>
      </g>
      <path d="M530 219q25 -47 57 -28" fill="none" stroke="#f0b873" strokeWidth="2" />
      <circle cx="69" cy="289" r="5" fill="#eaad72" />
      <circle cx="573" cy="332" r="4" fill="#f4c783" />
    </svg>
  )
}

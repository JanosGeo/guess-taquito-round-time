import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { pairs } from './data/pairs.ts'
import {
  describePairs,
  emptyAssignments,
  grade,
  prepareRound,
  revealAnswers,
  type Assignments,
  type CountryChip,
  type Round,
} from './lib/game.ts'
import './App.css'

const BANK = 'bank'

function dropTargetAt(
  x: number,
  y: number,
  results: Record<string, boolean> | null,
): string | null {
  const stack = document.elementsFromPoint(x, y)
  for (const node of stack) {
    if (!(node instanceof Element)) continue
    if (node.closest('.ghost')) continue
    const zone = node.closest('[data-drop]')
    if (!(zone instanceof HTMLElement)) continue
    const id = zone.dataset.drop
    if (!id) continue
    if (id !== BANK && results?.[id] === true) return null
    return id
  }
  return null
}

function slotForChip(assignments: Assignments, chipId: string): string | null {
  for (const [slotId, assigned] of Object.entries(assignments)) {
    if (assigned === chipId) return slotId
  }
  return null
}

type ChipProps = {
  chip: CountryChip
  locked: boolean
  dimmed: boolean
  onPointerDown: (
    chipId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void
}

function CountryChip({ chip, locked, dimmed, onPointerDown }: ChipProps) {
  const className = ['chip', locked ? 'locked' : '', dimmed ? 'dimmed' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type="button"
      className={className}
      data-chip={chip.id}
      draggable={false}
      aria-disabled={locked || undefined}
      onPointerDown={(event) => onPointerDown(chip.id, event)}
    >
      {chip.country}
    </button>
  )
}

function App() {
  const dataError = describePairs(pairs)
  const [round, setRound] = useState<Round>(() =>
    dataError ? { slots: [], chips: [] } : prepareRound(pairs),
  )
  const [assignments, setAssignments] = useState<Assignments>(() =>
    emptyAssignments(round.slots),
  )
  const [results, setResults] = useState<Record<string, boolean> | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const assignmentsRef = useRef(assignments)
  const resultsRef = useRef(results)
  const dragToken = useRef(0)
  const ghostRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0, width: 0, height: 0 })

  const placeChip = useCallback((chipId: string, target: string) => {
    const prev = assignmentsRef.current
    const fromSlot = slotForChip(prev, chipId)
    const locked = (slotId: string) => resultsRef.current?.[slotId] === true
    if (fromSlot && locked(fromSlot)) return
    if (target !== BANK && locked(target)) return
    if (target !== BANK && prev[target] === chipId) return
    if (target === BANK && !fromSlot) return

    const next: Assignments = { ...prev }
    if (target === BANK) {
      if (fromSlot) next[fromSlot] = null
    } else {
      const occupant = next[target] ?? null
      if (fromSlot) next[fromSlot] = occupant
      next[target] = chipId
    }

    assignmentsRef.current = next
    setAssignments(next)

    if (!resultsRef.current) return
    const graded = { ...resultsRef.current }
    if (fromSlot && graded[fromSlot] !== true) delete graded[fromSlot]
    if (target !== BANK && graded[target] !== true) delete graded[target]
    resultsRef.current = graded
    setResults(graded)
  }, [])

  useLayoutEffect(() => {
    const ghost = ghostRef.current
    if (!draggingId || !ghost) return
    const point = pointerRef.current
    ghost.style.width = `${point.width}px`
    ghost.style.height = `${point.height}px`
    ghost.style.transform = `translate(${point.x - point.offsetX}px, ${point.y - point.offsetY}px)`
  }, [draggingId])

  const chipById = new Map(round.chips.map((chip) => [chip.id, chip]))
  const assignedIds = new Set(
    Object.values(assignments).filter((id): id is string => id != null),
  )
  const bank = round.chips.filter((chip) => !assignedIds.has(chip.id))
  const filled = round.slots.every((slot) => assignments[slot.id])
  const correctCount = results
    ? Object.values(results).filter((value) => value).length
    : 0
  const solved =
    round.slots.length > 0 &&
    results != null &&
    round.slots.every((slot) => results[slot.id] === true)
  const won = solved && !revealed
  const canSubmit = filled && !won && !revealed && !dataError
  const draggingChip = draggingId ? chipById.get(draggingId) : undefined

  function onChipPointerDown(
    chipId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.button !== 0) return
    const fromSlot = slotForChip(assignmentsRef.current, chipId)
    if (fromSlot && resultsRef.current?.[fromSlot] === true) return

    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const token = ++dragToken.current
    const pointerId = event.pointerId
    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    }
    event.currentTarget.setPointerCapture(pointerId)
    setDraggingId(chipId)
    setOverId(dropTargetAt(event.clientX, event.clientY, resultsRef.current))

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId || dragToken.current !== token) return
      pointerRef.current.x = ev.clientX
      pointerRef.current.y = ev.clientY
      const ghost = ghostRef.current
      if (ghost) {
        const point = pointerRef.current
        ghost.style.transform = `translate(${ev.clientX - point.offsetX}px, ${ev.clientY - point.offsetY}px)`
      }
      const nextOver = dropTargetAt(ev.clientX, ev.clientY, resultsRef.current)
      setOverId((current) => (current === nextOver ? current : nextOver))
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      if (dragToken.current !== token) return
      const target = dropTargetAt(ev.clientX, ev.clientY, resultsRef.current)
      dragToken.current += 1
      setDraggingId(null)
      setOverId(null)
      if (target) placeChip(chipId, target)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  function onSubmit() {
    if (!filled || won) return
    const graded = grade(round.slots, assignmentsRef.current, round.chips)
    resultsRef.current = graded
    setResults(graded)
  }

  function onGiveUp() {
    if (won || revealed) return
    dragToken.current += 1
    setDraggingId(null)
    setOverId(null)
    const solvedAssignments = revealAnswers(round)
    const graded = grade(round.slots, solvedAssignments, round.chips)
    assignmentsRef.current = solvedAssignments
    resultsRef.current = graded
    setAssignments(solvedAssignments)
    setResults(graded)
    setRevealed(true)
  }

  function onReplay() {
    dragToken.current += 1
    setDraggingId(null)
    setOverId(null)
    const next = prepareRound(pairs)
    const cleared = emptyAssignments(next.slots)
    assignmentsRef.current = cleared
    resultsRef.current = null
    setRound(next)
    setAssignments(cleared)
    setResults(null)
    setRevealed(false)
  }

  const status = revealed
    ? 'Answers revealed.'
    : won
    ? `All ${round.slots.length} pairs are correct.`
    : results
      ? `${correctCount} / ${round.slots.length} correct`
      : filled
        ? 'Submit to check your pairs.'
        : 'Place every country, then submit.'

  if (dataError) {
    return (
      <main className="app">
        <h1>Pair the round time with the country</h1>
        <p className="setup-error">
          Fix the list in <code>src/data/pairs.ts</code>. {dataError}
        </p>
      </main>
    )
  }

  return (
    <main className={draggingId ? 'app dragging' : 'app'}>
      <header className="top">
        <div className="intro">
          <h1>Pair the round time with the country</h1>
          <p>
            DesTaquito successfully completed a ACW 100k on Nov 18th, 2026. Can you pair the round time with the country?
          </p>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="primary"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            Submit
          </button>
          <button type="button" className="secondary" onClick={onReplay}>
            Play again
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onGiveUp}
            disabled={won || revealed}
          >
            I give up
          </button>
          <p className={won ? 'status done' : 'status'} aria-live="polite">
            {status}
          </p>
        </div>
      </header>

      <div className="board">
        <section className="sheet" aria-label="Round times">
          <div className="sheet-head">
            <h2>Times</h2>
            <p>Fastest to slowest</p>
          </div>
          <ol className="rows">
            {round.slots.map((slot) => {
              const chipId = assignments[slot.id]
              const chip = chipId ? chipById.get(chipId) : undefined
              const mark = results?.[slot.id]
              const rowClass = [
                'row',
                overId === slot.id ? 'over' : '',
                mark === true ? 'correct' : '',
                mark === false ? 'incorrect' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <li key={slot.id} className={rowClass} data-drop={slot.id}>
                  <span className="time">{slot.time}</span>
                  <div className="slot">
                    {chip ? (
                      <div className="placed">
                        <CountryChip
                          chip={chip}
                          locked={mark === true}
                          dimmed={draggingId === chip.id}
                          onPointerDown={onChipPointerDown}
                        />
                        {mark !== true && (
                          <button
                            type="button"
                            className="remove"
                            aria-label={`Remove ${chip.country}`}
                            onClick={() => placeChip(chip.id, BANK)}
                          >
                            X
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="placeholder">Drop country</span>
                    )}
                    {revealed && <span className="mark ok">Answer</span>}
                    {!revealed && mark === true && <span className="mark ok">Correct</span>}
                    {!revealed && mark === false && <span className="mark bad">Incorrect</span>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <aside
          className={overId === BANK ? 'bank over' : 'bank'}
          data-drop={BANK}
          aria-label="Countries"
        >
          <h2>Countries</h2>
          {bank.length === 0 ? (
            <p className="empty">All countries are placed.</p>
          ) : (
            <div className="bank-chips">
              {bank.map((chip) => (
                <CountryChip
                  key={chip.id}
                  chip={chip}
                  locked={false}
                  dimmed={draggingId === chip.id}
                  onPointerDown={onChipPointerDown}
                />
              ))}
            </div>
          )}
        </aside>
      </div>

      {draggingChip && (
        <div ref={ghostRef} className="chip ghost" aria-hidden="true">
          {draggingChip.country}
        </div>
      )}
    </main>
  )
}

export default App

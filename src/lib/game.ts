import type { RoundPair } from '../data/pairs.ts'

const TIME_PATTERN = /^(\d+)m(\d+)s$/

export type TimeSlot = {
  id: string
  time: string
  seconds: number
  country: string
}

export type CountryChip = {
  id: string
  country: string
}

export type Round = {
  slots: TimeSlot[]
  chips: CountryChip[]
}

export type Assignments = Record<string, string | null>

export function parseTime(time: string): number {
  const match = TIME_PATTERN.exec(time)
  if (!match) {
    throw new Error(`Invalid time "${time}". Use the form 1m23s.`)
  }
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  return minutes * 60 + seconds
}

export function describePairs(source: readonly RoundPair[]): string | null {
  if (source.length === 0) {
    return 'Add at least one pair in src/data/pairs.ts.'
  }
  for (const pair of source) {
    if (!TIME_PATTERN.test(pair.time)) {
      return `Invalid time "${pair.time}". Use the form 1m23s.`
    }
    if (pair.country.trim() === '') {
      return 'Every pair needs a country.'
    }
  }
  return null
}

export function prepareRound(source: readonly RoundPair[]): Round {
  const decorated = source.map((pair, index) => ({
    id: `slot-${index}`,
    time: pair.time,
    seconds: parseTime(pair.time),
    country: pair.country,
    order: index,
  }))
  decorated.sort((a, b) => a.seconds - b.seconds || a.order - b.order)
  const slots: TimeSlot[] = decorated.map((slot) => ({
    id: slot.id,
    time: slot.time,
    seconds: slot.seconds,
    country: slot.country,
  }))
  const chips = source
    .map((pair, index) => ({
      id: `chip-${index}`,
      country: pair.country,
    }))
    .sort(
      (a, b) =>
        a.country.localeCompare(b.country, undefined, { sensitivity: 'base' }) ||
        a.id.localeCompare(b.id),
    )
  return { slots, chips }
}

export function emptyAssignments(slots: readonly TimeSlot[]): Assignments {
  const assignments: Assignments = {}
  for (const slot of slots) assignments[slot.id] = null
  return assignments
}

export function grade(
  slots: readonly TimeSlot[],
  assignments: Assignments,
  chips: readonly CountryChip[],
): Record<string, boolean> {
  const countries = new Map(chips.map((chip) => [chip.id, chip.country]))
  const results: Record<string, boolean> = {}
  for (const slot of slots) {
    const chipId = assignments[slot.id]
    results[slot.id] = chipId != null && countries.get(chipId) === slot.country
  }
  return results
}

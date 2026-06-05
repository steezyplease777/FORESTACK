import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconArrowsUpDown,
} from '@tabler/icons-react'

import { cn } from '@/lib/utils'

const DIRECTION_LABELS: Record<string, string> = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  OTHER: 'Other',
}

const DIRECTION_STYLES: Record<
  string,
  {
    bg: string
    color: string
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  INBOUND: { bg: '#dbeafe', color: '#1d4ed8', Icon: IconArrowDownLeft },
  OUTBOUND: { bg: '#ffedd5', color: '#c2410c', Icon: IconArrowUpRight },
  OTHER: { bg: '#f3f4f6', color: '#4b5563', Icon: IconArrowsUpDown },
}

const toTitleCase = (input: string): string =>
  String(input)
    .toLowerCase()
    .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

type DirectionCellProps = {
  direction: string
}

export function DirectionCell({ direction }: DirectionCellProps) {
  const raw = (direction || '').trim().toUpperCase()
  if (!raw) return <span className="text-xs text-muted-foreground">—</span>

  const style = DIRECTION_STYLES[raw] ?? DIRECTION_STYLES.OTHER
  const label = DIRECTION_LABELS[raw] ?? toTitleCase(raw)
  const Icon = style.Icon

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5',
        'text-xs font-normal whitespace-nowrap',
      )}
      style={{ background: style.bg, color: style.color }}
    >
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  )
}

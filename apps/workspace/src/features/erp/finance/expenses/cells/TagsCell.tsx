// @ts-nocheck

import * as React from 'react'
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Badge } from '@/components/reui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import {
  useCreateExpenseTag,
  useExpenseTags,
  useExpenseUpdate,
} from '../data/use-expenses-query'
import type { ExpenseRow } from '../ExpenseAdminTable.types'
import {
  useOptimisticDisplay,
  usePopoverTriggerProtection,
} from './combobox-shared'

type TagEntry = { id: string; label: string }

type TagsCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

const MAX_VISIBLE_TAGS = 3

function TagsHoverPanel({ tags }: { tags: TagEntry[] }) {
  if (tags.length === 0) return null

  return (
    <div className="w-[260px] max-w-[min(300px,calc(100vw-2rem))] text-left">
      <div className="max-h-[min(180px,32vh)] overflow-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-7 whitespace-nowrap px-2.5 py-0 text-[11px] font-bold uppercase tracking-wide">
                Tags
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow
                key={tag.id}
                className="border-b border-border/40 last:border-0 hover:bg-transparent"
              >
                <TableCell className="whitespace-nowrap px-2.5 py-1 text-[11px] text-foreground">
                  {tag.label || tag.id.slice(0, 8)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function TruncatedTagsHoverShell({
  tags,
  truncated,
  children,
}: {
  tags: TagEntry[]
  truncated: boolean
  children: React.ReactElement
}) {
  if (!truncated || tags.length === 0) return children

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="z-[200] w-auto border p-2 shadow-md"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TagsHoverPanel tags={tags} />
      </HoverCardContent>
    </HoverCard>
  )
}

export function TagsCell({ row, companyId, readOnly }: TagsCellProps) {
  const update = useExpenseUpdate(companyId)
  const createTag = useCreateExpenseTag(companyId)
  const tagsQuery = useExpenseTags(companyId)
  const allTags = tagsQuery.data ?? []

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const { triggerProps, contentProps } = usePopoverTriggerProtection()

  const optimistic = useOptimisticDisplay(row.invoiceTags)
  const displayTags: TagEntry[] = optimistic.display ?? row.invoiceTags
  const displayIds = new Set(displayTags.map((t) => t.id))

  const trimmedSearch = search.trim()
  const options = React.useMemo(() => {
    const needle = trimmedSearch.toLowerCase()
    if (!needle) return allTags
    return allTags.filter((t) => t.name.toLowerCase().includes(needle))
  }, [allTags, trimmedSearch])

  const exactMatch = options.some(
    (opt) => opt.name.trim().toLowerCase() === trimmedSearch.toLowerCase(),
  )
  const canCreate =
    trimmedSearch.length > 0 && !exactMatch && !createTag.isPending

  const persistTags = (nextTags: TagEntry[], successMessage?: string) => {
    optimistic.apply(nextTags)
    update.mutate(
      { id: row.id, patch: { tags: nextTags.map((t) => t.id) } },
      {
        onSuccess: () => {
          if (successMessage) toast.success(successMessage)
        },
        onError: (err) => {
          optimistic.revert()
          toast.error('Failed to update tags', {
            description: err instanceof Error ? err.message : undefined,
          })
        },
      },
    )
  }

  const toggleTag = (tagId: string, tagLabel: string) => {
    const nextTags = displayIds.has(tagId)
      ? displayTags.filter((t) => t.id !== tagId)
      : [...displayTags, { id: tagId, label: tagLabel }]
    persistTags(nextTags)
  }

  const removeTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const nextTags = displayTags.filter((t) => t.id !== tagId)
    persistTags(nextTags)
  }

  const handleCreateTag = async () => {
    if (!canCreate) return
    try {
      const created = await createTag.mutateAsync(trimmedSearch)
      const nextTags = [
        ...displayTags,
        { id: created.id, label: created.name },
      ]
      persistTags(nextTags, 'Tag created')
      setSearch('')
    } catch (err) {
      toast.error('Failed to create tag', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  if (readOnly) {
    if (row.invoiceTags.length === 0) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    const visible = row.invoiceTags.slice(0, MAX_VISIBLE_TAGS)
    const overflow = row.invoiceTags.length - visible.length
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {visible.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            size="xs"
            className="max-w-full truncate"
          >
            {tag.label || tag.id.slice(0, 8)}
          </Badge>
        ))}
        {overflow > 0 ? (
          <span className="text-[10px] text-muted-foreground">+{overflow}</span>
        ) : null}
      </div>
    )
  }

  const visible = displayTags.slice(0, MAX_VISIBLE_TAGS)
  const overflow = displayTags.length - visible.length
  const showOverflowHover = overflow > 0 && !open

  const chipTrigger = (
    <button
      type="button"
      aria-label={displayTags.length > 0 ? 'Edit tags' : 'Add tags'}
      disabled={update.isPending}
      className={cn(
        'flex min-h-6 w-full min-w-0 items-center gap-1 rounded px-0.5 text-left',
        'transition-colors hover:bg-muted/50',
      )}
      {...triggerProps}
    >
      {displayTags.length === 0 ? (
        <span className="text-xs text-muted-foreground">—</span>
      ) : (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {visible.map((tag) => (
            <HoverCard key={tag.id} openDelay={150} closeDelay={80}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  size="xs"
                  className="max-w-full cursor-default truncate"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {tag.label || tag.id.slice(0, 8)}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent
                side="top"
                align="start"
                className="z-[200] w-auto border p-2 shadow-md"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Tag
                </p>
                <p className="text-sm font-medium text-foreground">
                  {tag.label || tag.id}
                </p>
              </HoverCardContent>
            </HoverCard>
          ))}
          {overflow > 0 ? (
            <span className="text-[10px] text-muted-foreground">+{overflow}</span>
          ) : null}
        </div>
      )}
    </button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TruncatedTagsHoverShell
        tags={displayTags}
        truncated={showOverflowHover}
      >
        <PopoverTrigger asChild>{chipTrigger}</PopoverTrigger>
      </TruncatedTagsHoverShell>
      <PopoverContent
        {...contentProps}
        align="start"
        className="z-[200] w-[260px] p-2"
      >
        <Input
          placeholder="Search or create tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) {
              e.preventDefault()
              void handleCreateTag()
            }
          }}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-48 overflow-auto">
          {tagsQuery.isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : options.length === 0 && !canCreate ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No tags found.
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {options.map((opt) => {
                const isSelected = displayIds.has(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => toggleTag(opt.id, opt.name)}
                  >
                    <IconCheck
                      className={cn(
                        'size-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">{opt.name}</span>
                  </button>
                )
              })}
              {canCreate ? (
                <button
                  type="button"
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => void handleCreateTag()}
                  disabled={createTag.isPending}
                >
                  <IconPlus className="size-4 shrink-0" />
                  <span>
                    Create &ldquo;<strong>{trimmedSearch}</strong>&rdquo;
                  </span>
                </button>
              ) : null}
              {createTag.isPending ? (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  Creating tag…
                </div>
              ) : null}
            </div>
          )}
        </div>
        {displayTags.length > 0 ? (
          <div className="mt-2 border-t pt-2">
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  size="xs"
                  className="gap-0.5 pr-0.5"
                >
                  <span className="max-w-[120px] truncate">
                    {tag.label || tag.id.slice(0, 8)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${tag.label || tag.id}`}
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={(e) => removeTag(tag.id, e)}
                  >
                    <IconX className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useForm } from '@tanstack/react-form'
import { Store, useStore } from '@tanstack/react-store'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import { useHotkey } from '@tanstack/react-hotkeys'
import { createServerFn } from '@tanstack/react-start'

// --- TanStack Start: server function ------------------------------------------------

const getServerTime = createServerFn({ method: 'GET' }).handler(async () => {
  return { now: new Date().toISOString(), hostname: 'cloudflare-worker' }
})

// --- TanStack Store: tiny global store ----------------------------------------------

const counterStore = new Store({ count: 0 })
const increment = () => counterStore.setState((s) => ({ count: s.count + 1 }))
const decrement = () => counterStore.setState((s) => ({ count: s.count - 1 }))

// --- Fake data for Table + Virtual --------------------------------------------------

type Row = { id: number; name: string; value: number }

const rows: Array<Row> = Array.from({ length: 2000 }, (_, i) => ({
  id: i + 1,
  name: `Row ${i + 1}`,
  value: Math.round(Math.random() * 1000),
}))

export const Route = createFileRoute('/dev/showcase')({
  component: ShowcasePage,
})

function ShowcasePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <header>
        <h1 className="text-2xl font-semibold">TanStack library showcase</h1>
        <p className="text-sm text-muted-foreground">
          Smoke test for every TanStack library wired into this app. Each
          section is independent. See <code>AGENTS.md</code> for the full
          stack list.
        </p>
      </header>

      <RouterSection />
      <StartSection />
      <QuerySection />
      <TableSection />
      <FormSection />
      <StoreSection />
      <VirtualSection />
      <PacerSection />
      <HotkeysSection />
      <AiSection />
      <DbSection />
    </div>
  )
}

function Section({
  title,
  library,
  children,
}: {
  title: string
  library: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        <code className="text-xs text-muted-foreground">{library}</code>
      </div>
      {children}
    </section>
  )
}

function RouterSection() {
  return (
    <Section title="Router" library="@tanstack/react-router">
      <div className="flex gap-3 text-sm">
        <Link to="/" className="underline">
          Landing
        </Link>
        <Link to="/login" className="underline">
          Login
        </Link>
        <Link to="/dev/showcase" className="underline">
          Reload this page
        </Link>
      </div>
    </Section>
  )
}

function StartSection() {
  const [time, setTime] = useState<string | null>(null)
  return (
    <Section title="Start: server functions" library="@tanstack/react-start">
      <button
        type="button"
        className="rounded border px-3 py-1 text-sm"
        onClick={async () => {
          const res = await getServerTime()
          setTime(res.now)
        }}
      >
        Call server function
      </button>
      {time && <p className="mt-2 text-xs text-muted-foreground">Server time: {time}</p>}
    </Section>
  )
}

function QuerySection() {
  const qc = useQueryClient()
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['showcase', 'time'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400))
      return new Date().toISOString()
    },
  })
  return (
    <Section title="Query" library="@tanstack/react-query">
      <div className="flex items-center gap-3 text-sm">
        <span>{isFetching ? 'loading…' : data}</span>
        <button type="button" className="rounded border px-2 py-1" onClick={() => refetch()}>
          Refetch
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1"
          onClick={() => qc.invalidateQueries({ queryKey: ['showcase'] })}
        >
          Invalidate
        </button>
      </div>
    </Section>
  )
}

function TableSection() {
  const columnHelper = createColumnHelper<Row>()
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('value', { header: 'Value' }),
    ],
    [columnHelper],
  )
  const table = useReactTable({
    data: rows.slice(0, 5),
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <Section title="Table" library="@tanstack/react-table">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="border-b px-2 py-1 text-left">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id}>
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="border-b px-2 py-1">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

function FormSection() {
  const [submitted, setSubmitted] = useState<{ email: string } | null>(null)
  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      setSubmitted(value)
    },
  })
  return (
    <Section title="Form" library="@tanstack/react-form">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex items-center gap-2 text-sm"
      >
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => (value.includes('@') ? undefined : 'Need an @'),
          }}
        >
          {(field) => (
            <>
              <input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="rounded border px-2 py-1"
                placeholder="you@example.com"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-destructive">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </>
          )}
        </form.Field>
        <button type="submit" className="rounded border px-2 py-1">
          Submit
        </button>
      </form>
      {submitted && <p className="mt-2 text-xs">Submitted: {submitted.email}</p>}
    </Section>
  )
}

function StoreSection() {
  const count = useStore(counterStore, (s) => s.count)
  return (
    <Section title="Store" library="@tanstack/react-store">
      <div className="flex items-center gap-2 text-sm">
        <button type="button" className="rounded border px-2 py-1" onClick={decrement}>
          −
        </button>
        <span className="tabular-nums">{count}</span>
        <button type="button" className="rounded border px-2 py-1" onClick={increment}>
          +
        </button>
      </div>
    </Section>
  )
}

function VirtualSection() {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
  })
  return (
    <Section title="Virtual" library="@tanstack/react-virtual">
      <div ref={parentRef} className="h-64 overflow-auto rounded border text-sm">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((v) => {
            const row = rows[v.index]
            return (
              <div
                key={v.key}
                className="border-b px-2"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: v.size,
                  transform: `translateY(${v.start}px)`,
                }}
              >
                #{row.id} — {row.name} — {row.value}
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

function PacerSection() {
  const [value, setValue] = useState('')
  const [committed, setCommitted] = useState('')
  const commit = useDebouncedCallback((next: string) => setCommitted(next), { wait: 400 })
  return (
    <Section title="Pacer" library="@tanstack/react-pacer">
      <div className="flex items-center gap-2 text-sm">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            commit(e.target.value)
          }}
          placeholder="Type something"
          className="rounded border px-2 py-1"
        />
        <span className="text-xs text-muted-foreground">debounced: {committed}</span>
      </div>
    </Section>
  )
}

function HotkeysSection() {
  const [pings, setPings] = useState(0)
  useHotkey({ key: 'K', mod: true }, () => setPings((p) => p + 1))
  return (
    <Section title="Hotkeys" library="@tanstack/react-hotkeys">
      <p className="text-sm">
        Press <kbd className="rounded border px-1">⌘/Ctrl+K</kbd> — fired {pings} times.
      </p>
    </Section>
  )
}

function AiSection() {
  return (
    <Section title="AI" library="@tanstack/ai">
      <p className="text-sm text-muted-foreground">
        Installed. Wire up a provider + <code>useChat</code> when the first AI
        feature lands (see <code>AGENTS.md → Next steps</code>).
      </p>
    </Section>
  )
}

function DbSection() {
  return (
    <Section title="DB / Supabase" library="@supabase/supabase-js">
      <p className="text-sm text-muted-foreground">
        Supabase is the primary data layer. Use{' '}
        <code>createClient</code> from{' '}
        <code>@/lib/datasource/supabase/server</code> inside server functions and{' '}
        <code>@/lib/datasource/supabase/client</code> in browser code. TanStack
        DB / Electric are optional layers — see <code>AGENTS.md</code> if you
        want to add realtime sync later.
      </p>
    </Section>
  )
}

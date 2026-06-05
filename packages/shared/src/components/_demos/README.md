# Demo and scaffold components

Reference implementations copied from shadcn/ui block examples. **Not used in production routes** — kept for local experimentation, Storybook, and future composite migrations.

| File / folder | Origin |
| ------------- | ------ |
| `app-sidebar.tsx` | shadcn sidebar-07 demo |
| `data-table.tsx` | shadcn data-table demo |
| `chart-area-interactive.tsx` | shadcn chart demo |
| `section-cards.tsx` | shadcn dashboard cards |
| `table-02.tsx` | shadcn table variant |
| `search-form.tsx` | shadcn search form |
| `nav-*.tsx` | shadcn sidebar nav primitives (demo-only) |
| `patterns/` | ReUI pattern table/tab experiments |

Production composites live in `../composites/`. When promoting a demo to production, move it into `composites/` (or a subfolder like `composites/data-table/`) and wire real data hooks.

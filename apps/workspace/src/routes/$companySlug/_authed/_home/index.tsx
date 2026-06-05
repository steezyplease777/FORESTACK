import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$companySlug/_authed/_home/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$companySlug/dashboard',
      params: { companySlug: params.companySlug },
      search: { days: 90, channels: [] },
    })
  },
})

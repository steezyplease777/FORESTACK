#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"

echo "==> Creating monorepo directories"
mkdir -p "$ROOT/packages/shared/src"
mkdir -p "$ROOT/apps/studio/src"
mkdir -p "$ROOT/apps/workspace/src"
mkdir -p "$ROOT/apps/studio/public"
mkdir -p "$ROOT/apps/workspace/public"

echo "==> Copying shared package"
cp -R "$SRC/components" "$ROOT/packages/shared/src/"
cp -R "$SRC/hooks" "$ROOT/packages/shared/src/"
cp -R "$SRC/integrations" "$ROOT/packages/shared/src/"
cp "$SRC/styles.css" "$ROOT/packages/shared/src/"

mkdir -p "$ROOT/packages/shared/src/lib"
cp "$SRC/lib/compose-refs.ts" "$ROOT/packages/shared/src/lib/"
cp "$SRC/lib/errors.ts" "$ROOT/packages/shared/src/lib/"
cp "$SRC/lib/primitive.ts" "$ROOT/packages/shared/src/lib/"
cp "$SRC/lib/utils.ts" "$ROOT/packages/shared/src/lib/"
cp -R "$SRC/lib/datasource" "$ROOT/packages/shared/src/lib/"
cp -R "$SRC/lib/utils" "$ROOT/packages/shared/src/lib/"
cp -R "$SRC/lib/theme" "$ROOT/packages/shared/src/lib/"
cp -R "$SRC/lib/hooks" "$ROOT/packages/shared/src/lib/"
mkdir -p "$ROOT/packages/shared/src/lib/auth"
cp "$SRC/lib/auth/server-context.ts" "$ROOT/packages/shared/src/lib/auth/"
mkdir -p "$ROOT/packages/shared/src/lib/data"
cp -R "$SRC/lib/data/_shared" "$ROOT/packages/shared/src/lib/data/"
mkdir -p "$ROOT/packages/shared/src/lib/data/auth"
cp "$SRC/lib/data/auth/server.ts" "$ROOT/packages/shared/src/lib/data/auth/"
mkdir -p "$ROOT/packages/shared/src/lib/data/storage"
cp "$SRC/lib/data/storage/logos.ts" "$ROOT/packages/shared/src/lib/data/storage/"
mkdir -p "$ROOT/packages/shared/src/lib/data/user/profile"
cp "$SRC/lib/data/user/profile/server.ts" "$ROOT/packages/shared/src/lib/data/user/profile/"
cp "$SRC/lib/data/user/profile/upload-avatar.ts" "$ROOT/packages/shared/src/lib/data/user/profile/"

echo "==> Copying studio app"
mkdir -p "$ROOT/apps/studio/src/features/saas"
cp -R "$SRC/features/saas/." "$ROOT/apps/studio/src/features/saas/"
mkdir -p "$ROOT/apps/studio/src/lib/data"
cp -R "$SRC/lib/data/organizations" "$ROOT/apps/studio/src/lib/data/"
cp -R "$SRC/lib/data/onboarding" "$ROOT/apps/studio/src/lib/data/"
cp -R "$SRC/lib/data/company-editor" "$ROOT/apps/studio/src/lib/data/"
mkdir -p "$ROOT/apps/studio/src/lib/data/auth"
cp "$SRC/lib/data/auth/saas-session.ts" "$ROOT/apps/studio/src/lib/data/auth/"

cp -R "$SRC/routes/_saasPortal/." "$ROOT/apps/studio/src/routes/"
cp "$SRC/routes/__root.tsx" "$ROOT/apps/studio/src/routes/__root.tsx"
cp "$SRC/router.tsx" "$ROOT/apps/studio/src/router.tsx"
cp "$SRC/server.ts" "$ROOT/apps/studio/src/server.ts"
cp "$SRC/start.ts" "$ROOT/apps/studio/src/start.ts"
cp -R "$ROOT/public/." "$ROOT/apps/studio/public/"

echo "==> Copying workspace app"
mkdir -p "$ROOT/apps/workspace/src/features/company"
cp -R "$SRC/features/company/." "$ROOT/apps/workspace/src/features/company/"
mkdir -p "$ROOT/apps/workspace/src/lib/auth"
cp "$SRC/lib/auth/tenant-context.ts" "$ROOT/apps/workspace/src/lib/auth/"
mkdir -p "$ROOT/apps/workspace/src/lib/providers"
cp "$SRC/lib/providers/tenant.ts" "$ROOT/apps/workspace/src/lib/providers/"
mkdir -p "$ROOT/apps/workspace/src/lib/routing"
cp "$SRC/lib/routing/tenant-rewrite.ts" "$ROOT/apps/workspace/src/lib/routing/"
mkdir -p "$ROOT/apps/workspace/src/lib/data"
for dir in plm crm erp pm dashboard team orders portal-bundles; do
  cp -R "$SRC/lib/data/$dir" "$ROOT/apps/workspace/src/lib/data/"
done
mkdir -p "$ROOT/apps/workspace/src/lib/data/user/tenant"
cp -R "$SRC/lib/data/user/tenant/." "$ROOT/apps/workspace/src/lib/data/user/tenant/"

mkdir -p "$ROOT/apps/workspace/src/routes/\$companySlug"
cp -R "$SRC/routes/_companyPortal/\$companySlug/." "$ROOT/apps/workspace/src/routes/\$companySlug/"
cp "$SRC/routes/__root.tsx" "$ROOT/apps/workspace/src/routes/__root.tsx"
cp "$SRC/router.tsx" "$ROOT/apps/workspace/src/router.tsx"
cp "$SRC/server.ts" "$ROOT/apps/workspace/src/server.ts"
cp "$SRC/start.ts" "$ROOT/apps/workspace/src/start.ts"
cp -R "$ROOT/public/." "$ROOT/apps/workspace/public/"

echo "==> Updating studio route paths"
find "$ROOT/apps/studio/src" -type f \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i '' \
  -e "s|/_saasPortal/|/|g" \
  -e "s|/_saasPortal'|/'|g" \
  -e "s|/_saasPortal\"|/\"|g" \
  {} +

echo "==> Updating workspace route paths"
find "$ROOT/apps/workspace/src" -type f \( -name '*.ts' -o -name '*.tsx' \) -exec sed -i '' \
  -e "s|/_companyPortal/|/|g" \
  -e "s|/_companyPortal'|/'|g" \
  -e "s|/_companyPortal\"|/\"|g" \
  {} +

echo "==> Fixing __root styles import"
for app in studio workspace; do
  sed -i '' "s|import appCss from '../styles.css?url'|import appCss from '@/styles.css?url'|g" \
    "$ROOT/apps/$app/src/routes/__root.tsx"
  sed -i '' "s|import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'|import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'|g" \
    "$ROOT/apps/$app/src/routes/__root.tsx"
done

echo "==> Updating tenant-rewrite comment"
sed -i '' 's|_companyPortal/\$companySlug|/$companySlug|g' \
  "$ROOT/apps/workspace/src/lib/routing/tenant-rewrite.ts"

echo "==> Studio router: remove tenant rewrite"
cat > "$ROOT/apps/studio/src/router.tsx" << 'ROUTER_EOF'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getContext } from '@/integrations/tanstack-query/root-provider'
import { NotFound } from './routes/__root'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    defaultNotFoundComponent: NotFound,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
ROUTER_EOF

echo "==> Done"

// @ts-nocheck
import { createContext, useContext } from 'react'
import type { ResolvedCompany } from '@/lib/providers/tenant'
import type { CompanyUserProfile } from '@/lib/auth/tenant-context'

export type AuthUser = {
  id: string
  email: string | null
  name?: string | null
  image?: string | null
} | null

type CompanyProviderProps = {
  companySlug: string
  company: ResolvedCompany | { companyId: null }
  userId: string | null
  authUser: AuthUser
  companyUser: CompanyUserProfile | null
  children: React.ReactNode
}

type CompanyContextValue = Omit<CompanyProviderProps, 'children'>
const CompanyProviderContext = createContext<CompanyContextValue | null>(null)

export function CompanyProvider({
  companySlug,
  company,
  userId,
  authUser,
  companyUser,
  children,
}: CompanyProviderProps) {
  return (
    <CompanyProviderContext.Provider
      value={{ companySlug, company, userId, authUser, companyUser }}
    >
      {children}
    </CompanyProviderContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyProviderContext)
  if (ctx == null) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return ctx
}

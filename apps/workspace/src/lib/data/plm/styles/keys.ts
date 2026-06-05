export const plmStyleKeys = {
  all: ['plm', 'styles'] as const,
  /**
   * Unpaginated list used to populate `<Select>` dropdowns in the
   * Product + Sourcing forms. Capped server-side at 500; a company
   * that genuinely needs more should expose a type-ahead search.
   */
  list: (companyId: string) => ['plm', 'styles', 'list', companyId] as const,
  detail: (companyId: string, styleId: string) =>
    ['plm', 'styles', 'detail', companyId, styleId] as const,
}

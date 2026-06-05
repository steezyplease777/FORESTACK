export const taskTemplateKeys = {
  all: ['pm', 'task-templates'] as const,
  list: (companyId: string) =>
    ['pm', 'task-templates', 'list', companyId] as const,
  detail: (companyId: string, templateId: string) =>
    ['pm', 'task-templates', 'detail', companyId, templateId] as const,
  categories: (companyId: string) =>
    ['pm', 'task-categories', 'list', companyId] as const,
}

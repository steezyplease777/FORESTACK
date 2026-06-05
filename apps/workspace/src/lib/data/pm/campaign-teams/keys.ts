export const campaignTeamKeys = {
  all: ['pm', 'campaign-teams'] as const,
  list: (campaignId: string) =>
    ['pm', 'campaign-teams', 'list', campaignId] as const,
}

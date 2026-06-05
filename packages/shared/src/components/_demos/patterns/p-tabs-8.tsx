// @ts-nocheck
import { Badge } from "@/components/reui/badge"

import { Card, CardContent } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { UserIcon, ZapIcon, BuildingIcon, FolderIcon, CheckSquareIcon, UsersIcon, FileTextIcon } from "lucide-react"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    description: "For individuals and small projects",
    icon: (
      <UserIcon className="size-5" />
    ),
    tablerIcon: "IconUser",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For growing teams and businesses",
    icon: (
      <ZapIcon className="size-5" />
    ),
    tablerIcon: "IconBolt",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    description: "For large organizations",
    icon: (
      <BuildingIcon className="size-5" />
    ),
    tablerIcon: "IconBuilding",
  },
]

export function Pattern() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <Tabs defaultValue="projects" orientation="vertical" className="gap-5">
        <TabsList variant="line" className="w-48 shrink-0">
          <TabsTrigger value="projects" className="justify-start gap-2">
            <FolderIcon className="size-4" />
            Projects
            <Badge variant="secondary" size="sm" className="ml-auto">
              8
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="justify-start gap-2">
            <CheckSquareIcon className="size-4" />
            Tasks
            <Badge variant="primary-light" size="sm" className="ml-auto">
              24
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="team" className="justify-start gap-2">
            <UsersIcon className="size-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="reports" className="justify-start gap-2">
            <FileTextIcon className="size-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <Card>
            <CardContent>
              <h3 className="text-foreground mb-2 font-semibold">
                Active Projects
              </h3>
              <p>8 projects are currently in progress across your workspace.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks">
          <Card>
            <CardContent>
              <h3 className="text-foreground mb-2 font-semibold">
                Pending Tasks
              </h3>
              <p>24 tasks need your attention this week.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team">
          <Card>
            <CardContent>
              <h3 className="text-foreground mb-2 font-semibold">
                Team Members
              </h3>
              <p>Manage your team and their access permissions.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardContent>
              <h3 className="text-foreground mb-2 font-semibold">Reports</h3>
              <p>View generated reports and export data.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
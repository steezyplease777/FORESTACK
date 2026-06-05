// @ts-nocheck
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TabsTemplate( { tabs }: { tabs: { label: string; value: string; jsxData: React.ReactNode }[] } ) {
  const renderTabs = () => {
    return tabs.map((tab) => (
      <TabsTrigger key={tab.value} value={tab.value} className="rounded-[2px]">
        {tab.label}
      </TabsTrigger>
    ));
  }
  const renderTabsContent = () => {
    return tabs.map((tab) => (
      <TabsContent key={tab.value} value={tab.value} className="py-1">
        <div className="p-0">
        {tab.jsxData}
        </div>
      </TabsContent>
    ));
  }
  return (
    <Tabs defaultValue={tabs[0].value} className="rounded-[10px] ">
      <TabsList variant="line" className="px-0">
        {renderTabs()}
      </TabsList>
      <div>
        <Separator/>
      </div>
      {renderTabsContent()}
    </Tabs>
  );
}
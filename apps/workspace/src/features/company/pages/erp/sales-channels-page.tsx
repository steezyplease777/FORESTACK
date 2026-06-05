// @ts-nocheck

import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  useSalesChannels,
  useCreateSalesChannel,
} from "@/lib/data/erp/sales-channels/hooks";

const routeApi = getRouteApi("/$companySlug/_authed/erp/sales-channels");
import type { SalesChannelType } from "@/lib/data/erp/sales-channels/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/reui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconSearch } from "@tabler/icons-react";

const CHANNEL_TYPES: SalesChannelType[] = ["B2B", "DTC"];

export function SalesChannelsPage() {
  const { data: channels, isLoading } = useSalesChannels();
  const createChannel = useCreateSalesChannel();

  const { q: search } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const setSearch = (q: string) =>
    navigate({ search: (prev) => ({ ...prev, q }) });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ name: "", channel_code: "", sales_channel_type: "" as SalesChannelType | "" });

  const filtered = (channels ?? []).filter((ch) =>
    !search ||
    ch.name.toLowerCase().includes(search.toLowerCase()) ||
    ch.channel_code.toLowerCase().includes(search.toLowerCase()) ||
    ch.sales_channel_type.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!form.name || !form.channel_code || !form.sales_channel_type) return;
    await createChannel.mutateAsync({
      name: form.name,
      channel_code: form.channel_code,
      sales_channel_type: form.sales_channel_type as SalesChannelType,
    });
    setForm({ name: "", channel_code: "", sales_channel_type: "" });
    setSheetOpen(false);
  };

  const actions = (
    <Button size="sm" onClick={() => setSheetOpen(true)}>
      <IconPlus className="mr-1 size-4" />
      Add Channel
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Channels"
        description={`${channels?.length ?? 0} channels`}
        actions={actions}
      />

      <Card>
        <CardHeader>
          <CardTitle>All channels</CardTitle>
          <CardDescription>
            {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
          </CardDescription>
          <CardAction>
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 w-56 pl-8"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No channels found"
              description={search ? "Try a different search." : "Add your first sales channel."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell className="font-medium">{ch.name}</TableCell>
                    <TableCell className="font-mono text-sm">{ch.channel_code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" size="sm">
                        {ch.sales_channel_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ch.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Sales Channel</SheetTitle>
            <SheetDescription>Create a new channel for allocations.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Channel Code *</Label>
              <Input
                value={form.channel_code}
                onChange={(e) => setForm({ ...form, channel_code: e.target.value })}
                placeholder="e.g. WHOLESALE-US"
              />
            </div>
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select
                value={form.sales_channel_type}
                onValueChange={(v) => setForm({ ...form, sales_channel_type: v as SalesChannelType })}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!form.name || !form.channel_code || !form.sales_channel_type || createChannel.isPending}
            >
              {createChannel.isPending ? "Creating…" : "Create Channel"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// @ts-nocheck
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { ProductWithVariants } from "@/lib/data/plm/products/client";

export default function ProductDetail({ productDetail }: { productDetail: ProductWithVariants }) {
  return (
    <div>
      <SheetHeader>
        <SheetTitle>{productDetail.name}</SheetTitle>
      </SheetHeader>
      <SheetDescription asChild>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p className="text-sm text-muted-foreground">{productDetail.style?.description ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{productDetail.style?.style_number ?? "—"}</p>
        </div>
      </SheetDescription>
    </div>
  );
}

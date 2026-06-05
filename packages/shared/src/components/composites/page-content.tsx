// @ts-nocheck
import { cn } from "@/lib/utils";

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:px-8 2xl:max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <Skeleton className="mt-2 h-12 w-full rounded-full" />
    </div>
  );
}

type SkeletonProps = { className?: string; tone?: "dark" | "light" };

export function Skeleton({ className = "", tone = "dark" }: SkeletonProps) {
  return <div aria-hidden="true" className={`${tone === "dark" ? "skeleton" : "skeleton-light"} ${className}`} />;
}

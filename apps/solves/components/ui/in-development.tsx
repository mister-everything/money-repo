import { cn } from "@/lib/utils";

interface InDevelopmentProps extends React.ComponentProps<"div"> {
  showLabel?: boolean;
}

function InDevelopment({ className, children, ...props }: InDevelopmentProps) {
  return (
    <div
      data-slot="in-development"
      className={cn(
        "relative rounded-md border-2 border-dashed border-muted-foreground/30 text-2xl bg-muted/30 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {children || "아직 지원하지 않는 블럭 입니다."}
    </div>
  );
}

export { InDevelopment };

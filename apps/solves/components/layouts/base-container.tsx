import { cn } from "@/lib/utils";

export function BaseContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-4xl 2xl:max-w-5xl mx-auto w-full px-6 pb-16",
        className,
      )}
      {...props}
    />
  );
}

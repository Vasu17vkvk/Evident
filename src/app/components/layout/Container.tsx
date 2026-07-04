import type { ComponentProps } from "react";
import { cn } from "../ui/utils";

type ContainerProps = ComponentProps<"div">;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-6 md:px-12 lg:px-16", className)}
      {...props}
    />
  );
}

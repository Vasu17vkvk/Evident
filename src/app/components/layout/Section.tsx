import type { ComponentProps } from "react";
import { cn } from "../ui/utils";

type SectionProps = ComponentProps<"section"> & {
  spacing?: "tight" | "standard" | "hero";
  muted?: boolean;
};

const spacingMap = {
  tight: "py-20 md:py-24",
  standard: "py-20 md:py-28 lg:py-32",
  hero: "py-28 md:py-36 lg:py-40",
};

export function Section({
  className,
  spacing = "standard",
  muted = false,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "border-t border-border",
        spacingMap[spacing],
        muted && "bg-muted",
        className,
      )}
      {...props}
    />
  );
}

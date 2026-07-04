import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wider transition-all duration-150 outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "text-accent px-0 py-3 hover:text-accent/90",
        outline:
          "border border-foreground bg-transparent text-foreground px-6 py-3 hover:bg-foreground hover:text-background",
        secondary:
          "border border-foreground bg-transparent text-foreground px-6 py-3 hover:bg-foreground hover:text-background",
        ghost:
          "text-muted-foreground px-4 py-3 hover:text-foreground",
        destructive:
          "text-destructive px-0 py-3",
        link: "text-accent px-0 py-2 normal-case tracking-normal font-medium",
      },
      size: {
        default: "text-xs gap-2",
        sm: "text-[10px] py-2 gap-1.5",
        lg: "text-sm py-4 gap-3",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const showPrimaryUnderline = variant === "default" || variant === "destructive" || variant === undefined;
  const showGhostUnderline = variant === "ghost";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {showPrimaryUnderline && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-accent transition-transform duration-150 group-hover:scale-x-110"
        />
      )}
      {showGhostUnderline && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-foreground transition-transform duration-150 group-hover:scale-x-100"
        />
      )}
    </Comp>
  );
}

export { Button, buttonVariants };

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "../ui/utils";

const ease = [0.25, 0, 0, 1] as const;

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function FadeIn({ className, delay = 0, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease }}
      className={cn(className)}
      {...props}
    />
  );
}

type StaggerProps = HTMLMotionProps<"div"> & {
  stagger?: number;
  delayChildren?: number;
};

export function Stagger({
  className,
  stagger = 0.08,
  delayChildren = 0.1,
  children,
  ...props
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease },
        },
      }}
      className={cn(className)}
      {...props}
    />
  );
}

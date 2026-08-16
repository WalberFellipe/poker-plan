import * as React from "react";

import { cn } from "@/lib/utils";

const fieldClasses = [
  "w-full rounded-sm border border-pa-text/14 bg-pa-text/[.03]",
  "px-3.5 py-2.5 text-[15px] text-pa-text",
  "placeholder:text-pa-ghost",
  "transition-colors duration-150",
  "hover:border-pa-text/25",
  "focus:border-cy/50 focus:bg-cy/[.04] focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-45",
].join(" ");

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(fieldClasses, "h-11", className)}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(fieldClasses, "min-h-[132px] resize-y leading-relaxed", className)}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea, fieldClasses };

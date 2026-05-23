import * as React from ".pnpm/@types+react@19.2.15/node_modules/@types/react";
import * as LabelPrimitive from ".pnpm/@radix-ui+react-label@2.1.1_@types+react-dom@19.2.3_@types+react@19.2.15__@types+react@_dbba85457abbacf14d28bcb8d8d208da/node_modules/@radix-ui/react-label/dist/index.mjs";
import {
  cva,
  type VariantProps,
} from ".pnpm/class-variance-authority@0.7.1/node_modules/class-variance-authority/dist";
import { cn } from "../../../../lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

import * as PopoverPrimitive from "@radix-ui/react-popover";
import React from "react";

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => {
  return <PopoverPrimitive.Trigger asChild ref={ref} {...props} />;
});

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ children, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content {...props} ref={ref}>
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});

export const PopoverArrow = PopoverPrimitive.Arrow;

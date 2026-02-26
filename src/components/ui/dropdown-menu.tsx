import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuItem = DropdownMenuPrimitive.Item;

export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content className={cn("z-50 min-w-40 rounded-xl border bg-popover p-1 shadow-md", className)} sideOffset={6} {...props} /></DropdownMenuPrimitive.Portal>;
}

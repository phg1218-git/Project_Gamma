import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" /><DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-lg", className)} {...props}><DialogPrimitive.Close className="absolute right-4 top-4"><X className="h-4 w-4" /></DialogPrimitive.Close>{props.children}</DialogPrimitive.Content></DialogPrimitive.Portal>;
}

export const DialogHeader = (props: React.HTMLAttributes<HTMLDivElement>) => <div className="space-y-2" {...props} />;
export const DialogTitle = (props: React.ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className="text-lg font-semibold" {...props} />;
export const DialogDescription = (props: React.ComponentProps<typeof DialogPrimitive.Description>) => <DialogPrimitive.Description className="text-sm text-muted-foreground" {...props} />;

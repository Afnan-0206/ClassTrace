import * as React from "react"

import { cn } from "@/lib/utils"

export interface FieldProps extends React.ComponentProps<"div"> {}

export function Field({ className, ...props }: FieldProps) {
  return (
    <div
      role="group"
      data-slot="field"
      className={cn("flex flex-col gap-2 w-full", className)}
      {...props}
    />
  )
}

export function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs text-destructive font-medium", className)}
      {...props}
    />
  )
}


import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { cn } from "@/lib/utils"

function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      className={cn(
        "relative flex w-fit gap-2 rounded-xl border bg-card p-1 text-card-foreground shadow-xs",
        className as string,
      )}
      {...props}
    />
  )
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      className={cn("flex items-center gap-1", className as string)}
      {...props}
    />
  )
}

function ToolbarButton({ ...props }: ToolbarPrimitive.Button.Props) {
  return <ToolbarPrimitive.Button {...props} />
}

function ToolbarSeparator({
  className,
  ...props
}: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      className={cn("mx-0.5 my-1 w-px bg-border", className as string)}
      {...props}
    />
  )
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator }

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center rounded-xl font-semibold whitespace-nowrap",
    "transition-all duration-150 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97] active:opacity-90",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "gradient-primary text-white shadow-sm",
          "shadow-[0_4px_16px_rgba(80,70,230,0.30)]",
        ].join(" "),
        outline:
          "border-2 border-border bg-background text-foreground hover:bg-muted hover:border-primary/30",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80",
        ghost:
          "text-foreground hover:bg-muted",
        destructive:
          "bg-red-50 text-destructive border border-red-200/60 hover:bg-red-100",
        success:
          "gradient-success text-white shadow-[0_4px_16px_rgba(30,180,100,0.28)]",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs:  "h-7 px-3 text-xs gap-1 rounded-lg",
        sm:  "h-9 px-3.5 text-xs gap-1.5 rounded-xl",
        default: "h-11 px-5 text-sm gap-2",
        lg:  "h-13 px-6 text-base gap-2.5 rounded-2xl",
        xl:  "h-14 px-7 text-base gap-2.5 rounded-2xl",
        icon: "h-10 w-10 rounded-xl p-0",
        "icon-sm": "h-8 w-8 rounded-xl p-0",
        "icon-lg": "h-12 w-12 rounded-2xl p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

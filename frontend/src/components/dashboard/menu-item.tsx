import { ChevronRight } from "lucide-react"

export function MenuItem({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </a>
  )
}
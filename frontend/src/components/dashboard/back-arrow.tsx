import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

export const BackArrow = ({ className }: { className?: string }) => {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      className={cn('-ml-2', className)}
    >
      <Link to="/dashboard" aria-label="Back to home">
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </Button>
  )
}
import { Link } from "@tanstack/react-router"
import { Button } from "../ui/button"
import { ArrowLeft } from "lucide-react"

export const BackArrow = () => {
  return (
    <Button asChild variant="ghost" size="icon-sm" className="-ml-2 mb-3">
      <Link to="/dashboard" aria-label="Back to home">
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </Button>
  )
}
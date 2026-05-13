
"use client"

import { useEffect, useState } from "react"
import WelcomeContent from "./WelcomeContent"

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render an identical shell on server and client to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen">
        <h1 className="text-5xl font-logo text-primary drop-shadow-sm">MatchFlow</h1>
      </div>
    )
  }

  return <WelcomeContent />
}

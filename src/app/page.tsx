"use client"

import { useEffect, useState } from "react"
import WelcomeContent from "./WelcomeContent"

/**
 * Entry point for the app. Handles initial mount to prevent hydration mismatches.
 * Renders a stable shell that matches on both server and client.
 */
export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render a minimal, stable shell during the first pass (SSR and hydration)
  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen">
        <h1 className="text-5xl font-logo text-primary drop-shadow-sm">MatchFlow</h1>
      </div>
    )
  }

  // Once mounted, render the interactive content which handles auth redirects
  return <WelcomeContent />
}

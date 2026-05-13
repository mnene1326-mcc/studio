"use client"

import { useEffect, useState } from "react"
import WelcomeContent from "./WelcomeContent"

/**
 * Entry point for the app. Handles initial mount to prevent hydration mismatches.
 * Returns null during the first pass to ensure a stable hydration phase.
 */
export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // To prevent hydration mismatch, we return null on the server and initial client pass.
  // This ensures the DOM matches perfectly before we render the dynamic content.
  if (!mounted) {
    return null
  }

  // Once mounted, render the interactive content which handles auth redirects
  return <WelcomeContent />
}

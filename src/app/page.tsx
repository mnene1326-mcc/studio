
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Root Redirector.
 * Ensures the app always lands on the spacious /welcome screen first.
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/welcome")
  }, [router])

  return null
}

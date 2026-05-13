
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"

/**
 * Root Redirector.
 * Checks for an existing user session. 
 * If authenticated, proceeds to /home. Otherwise, lands on /welcome.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/home")
      } else {
        router.replace("/welcome")
      }
    }
  }, [user, loading, router])

  return null
}

"use client"

import dynamic from "next/dynamic"

const WelcomePage = dynamic(
  () => import("./WelcomeContent"),
  { ssr: false }
)

export default WelcomePage

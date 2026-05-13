"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Bottom navigation component for the mobile-first MatchFlow experience.
 * Features a clean, gesture-friendly design with active state highlighting.
 */
export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: "Home", icon: Home, href: "/home" },
    { label: "Chat", icon: MessageSquare, href: "/chats" },
    { label: "Me", icon: User, href: "/me" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-2px_20px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative",
              isActive ? "text-black" : "text-gray-400"
            )}
          >
            <div className={cn(
              "relative p-1.5 rounded-2xl flex items-center justify-center transition-all",
              isActive && "bg-[#D4FF00] shadow-lg shadow-[#D4FF00]/40 scale-110"
            )}>
              <item.icon className={cn("w-6 h-6", isActive ? "text-black fill-current" : "text-gray-400")} />
            </div>
            
            <span className={cn(
              "text-[10px] font-black tracking-tight mt-0.5",
              isActive ? "text-black" : "text-gray-400"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

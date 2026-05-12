
"use client"

import Link from "link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: "Home", icon: Home, href: "/home" },
    { label: "Chat", icon: MessageCircle, href: "/chats" },
    { label: "Me", icon: User, href: "/me" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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
              "p-2 rounded-xl flex items-center justify-center transition-all",
              isActive && "bg-[#EFFF24]/20"
            )}>
              <item.icon className={cn("w-6 h-6", isActive && "text-black fill-current opacity-80")} />
            </div>
            
            <span className={cn(
              "text-[10px] font-bold tracking-tight",
              isActive ? "text-black" : "text-gray-400"
            )}>
              {item.label}
            </span>

            {/* Notification Badge for Chat */}
            {item.label === "Chat" && (
              <div className="absolute top-1 right-[25%] bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white">
                99+
              </div>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

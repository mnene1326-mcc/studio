"use client"

import Link from "next/link"
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t h-20 flex items-center justify-around px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative",
              isActive ? "text-[#FF3B30]" : "text-gray-400"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl flex items-center justify-center transition-all",
              isActive && "bg-[#FF3B30]/10"
            )}>
              <item.icon className={cn("w-7 h-7", isActive && "text-[#FF3B30] fill-current opacity-80")} />
            </div>
            
            <span className={cn(
              "text-[10px] font-black tracking-tight mt-0.5",
              isActive ? "text-[#FF3B30]" : "text-gray-400"
            )}>
              {item.label}
            </span>

            {item.label === "Chat" && (
              <div className="absolute top-2 right-[20%] bg-[#FF3B30] text-white text-[9px] font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white shadow-sm">
                99+
              </div>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
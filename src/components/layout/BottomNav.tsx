"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { collection, query, where } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()

  const chatsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null
    return query(collection(db, "chats"), where("participants", "array-contains", user.uid))
  }, [db, user?.uid])

  const { data: chats } = useCollection(chatsQuery)

  const totalUnread = useMemo(() => {
    if (!user?.uid || !chats) return 0
    return chats.reduce((acc, chat) => {
      return acc + (chat.unreadCount?.[user.uid] || 0)
    }, 0)
  }, [chats, user?.uid])

  const navItems = [
    { label: "Home", icon: Home, href: "/home" },
    { label: "Chat", icon: MessageSquare, href: "/chats", badge: totalUnread },
    { label: "Me", icon: User, href: "/me" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-2px_20px_rgba(0,0,0,0.05)]">
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
              isActive && "bg-[#D4FF00] shadow-sm scale-110"
            )}>
              <item.icon className={cn("w-6 h-6", isActive ? "text-black fill-current" : "text-gray-400")} />
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </div>
            
            <span className={cn(
              "text-[9px] font-black tracking-tight mt-0.5",
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

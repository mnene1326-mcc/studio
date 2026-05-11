"use client"

import { useMemo } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Heart, MessageSquare, Sparkles } from "lucide-react"
import Image from "next/image"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  onboardingComplete: boolean
}

export default function HomePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const db = useFirestore()

  const usersQuery = useMemo(() => {
    return query(
      collection(db, "users"), 
      where("onboardingComplete", "==", true),
      limit(20)
    )
  }, [db])

  const { data: users, loading } = useCollection<UserProfile>(usersQuery)

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.uid !== currentUser?.uid)
  }, [users, currentUser])

  const handleChatClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    router.push(`/chats?startWith=${userId}`)
  }

  return (
    <div className="flex-1 pb-24 bg-background min-h-screen">
      <header className="sticky top-0 z-40 premium-blur border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-headline text-primary tracking-tight">Discover</h1>
        <Button variant="ghost" size="icon" className="rounded-full bg-primary/5 text-primary w-9 h-9">
          <Sparkles className="w-4 h-4" />
        </Button>
      </header>

      <main className="p-3 sm:p-4 lg:max-w-4xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4.5] rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
            <Heart className="w-16 h-16 text-muted" />
            <div className="space-y-1">
              <p className="text-xl font-headline text-primary">Awaiting the perfect match</p>
              <p className="text-sm font-body">New profiles arrive every day.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="overflow-hidden border-none shadow-lg rounded-[1.5rem] group cursor-pointer transition-all hover:shadow-2xl active:scale-95 duration-500 bg-transparent"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <div className="relative aspect-[3/4.5]">
                  <Image 
                    src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/600`} 
                    alt={user.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    data-ai-hint="person portrait"
                  />
                  
                  {/* Subtle Top Gradient for Chat Icon visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
                  
                  {/* Quick Chat Icon */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 rounded-full w-8 h-8 premium-blur text-white border-none hover:bg-white/40 z-10 shadow-sm"
                    onClick={(e) => handleChatClick(e, user.uid)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>

                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-2">
                    <div className="space-y-0.5">
                      <p className="font-headline text-lg truncate leading-none font-bold">{user.name}</p>
                      <div className="flex items-center text-[10px] opacity-80 font-body">
                        <MapPin className="w-2.5 h-2.5 mr-1" />
                        {user.country}
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="text-[8px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border-none uppercase w-fit">
                      {user.lookingFor}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

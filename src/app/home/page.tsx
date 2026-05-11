"use client"

import { useMemo } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
      <header className="sticky top-0 z-40 premium-blur border-b px-6 py-5 flex items-center justify-between">
        <h1 className="text-3xl font-headline text-primary tracking-tight">Discover</h1>
        <Button variant="ghost" size="icon" className="rounded-full bg-primary/5 text-primary">
          <Sparkles className="w-5 h-5" />
        </Button>
      </header>

      <main className="p-4 sm:p-6 lg:max-w-4xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-muted animate-pulse" />
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
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="overflow-hidden border-none shadow-xl rounded-[2rem] group cursor-pointer transition-all hover:shadow-2xl active:scale-95 duration-500"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <div className="relative aspect-[3/4]">
                  <Image 
                    src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/500`} 
                    alt={user.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    data-ai-hint="person portrait"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  
                  {/* Premium Action Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 rounded-full w-10 h-10 premium-blur text-white border-none hover:bg-white/40 z-10 shadow-lg"
                    onClick={(e) => handleChatClick(e, user.uid)}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>

                  <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                    <p className="font-headline text-2xl truncate leading-none">{user.name}</p>
                    <div className="flex items-center text-xs opacity-80 font-body">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      {user.country}
                    </div>
                  </div>
                </div>
                <CardContent className="p-3 bg-white flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[10px] font-medium tracking-wide px-3 py-1 rounded-full bg-primary/5 text-primary border-none uppercase">
                    {user.lookingFor}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

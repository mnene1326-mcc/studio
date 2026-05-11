"use client"

import { useMemo } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Heart, MessageSquare } from "lucide-react"
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
    <div className="flex-1 pb-20 bg-background min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-6 py-4">
        <h1 className="text-2xl font-headline text-primary">Discover</h1>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <Heart className="w-12 h-12 text-muted" />
            <p className="text-muted-foreground font-body">No matches found yet. Try again later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="overflow-hidden border-none shadow-md rounded-2xl group cursor-pointer active:scale-95 transition-transform"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <div className="relative aspect-[3/4]">
                  <Image 
                    src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/500`} 
                    alt={user.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    data-ai-hint="person portrait"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  {/* Direct Chat Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full w-8 h-8 bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/40 z-10"
                    onClick={(e) => handleChatClick(e, user.uid)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>

                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                    <p className="font-headline text-lg truncate">{user.name}</p>
                    <div className="flex items-center text-[10px] opacity-90">
                      <MapPin className="w-3 h-3 mr-1" />
                      {user.country}
                    </div>
                  </div>
                </div>
                <CardContent className="p-2 bg-white flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 bg-accent/20 text-primary border-none">
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

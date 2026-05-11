"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart } from "lucide-react"
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
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const q = query(
          collection(db, "users"), 
          where("onboardingComplete", "==", true),
          limit(20)
        )
        const querySnapshot = await getDocs(q)
        const fetchedUsers: UserProfile[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserProfile
          if (data.uid !== user.uid) {
            fetchedUsers.push(data)
          }
        })
        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <Heart className="w-12 h-12 text-muted" />
            <p className="text-muted-foreground font-body">No matches found yet. Try again later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {users.map((user) => (
              <Card 
                key={user.uid} 
                className="overflow-hidden border-none shadow-md rounded-2xl group cursor-pointer active:scale-95 transition-transform"
                onClick={() => router.push(`/chats?startWith=${user.uid}`)}
              >
                <div className="relative aspect-[3/4]">
                  <Image 
                    src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/500`} 
                    alt={user.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    data-ai-hint="person portrait"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
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
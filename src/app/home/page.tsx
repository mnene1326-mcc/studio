
"use client"

import { useMemo } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import Image from "next/image"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  dob: string
  onboardingComplete: boolean
}

function calculateAge(dob: string) {
  if (!dob) return 20
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
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
    <div className="flex-1 pb-24 bg-[#F8F9FA] min-h-screen">
      <header className="sticky top-0 z-40 bg-white px-6 pt-4 pb-2 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <h1 className="text-2xl font-black font-sans text-black tracking-tight">Recommend</h1>
              <div className="absolute -bottom-1 left-0 w-10 h-1 bg-[#1DB954] rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full relative">
              <Bell className="w-6 h-6 text-black" />
              <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-3 lg:max-w-5xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4.2] rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-40">
            <div className="text-xl font-bold">No profiles found</div>
            <p className="text-sm">Try expanding your search settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="relative overflow-hidden border-none rounded-[2rem] aspect-[3/4.2] group cursor-pointer premium-shadow"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/600`} 
                  alt={user.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  data-ai-hint="person portrait"
                />
                
                {/* Top Right Hi Badge */}
                <div 
                  className="absolute top-3 right-3 bg-[#C6FF00] rounded-xl px-2.5 py-1 shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all z-20"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-black font-black italic text-xs tracking-tighter">Hi</span>
                </div>

                {/* Bottom Overlay - Immersive Info */}
                <div className="absolute inset-x-0 bottom-0 p-3 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-white font-black text-base truncate drop-shadow-sm">{user.name}</span>
                    <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center scale-90">
                      <span className="text-[7px] text-black font-black">✔</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <div className="bg-[#FF4D94] rounded-lg px-2 py-0.5 flex items-center gap-1 shadow-sm">
                      <span className="text-[10px] text-white">♀</span>
                      <span className="text-[10px] text-white font-black">{calculateAge(user.dob)}</span>
                    </div>
                    <div className="bg-[#C6FF00] rounded-lg px-2 py-0.5 shadow-sm">
                      <span className="text-[10px] text-black font-black">13.6km</span>
                    </div>
                    <div className="bg-white/20 rounded-lg px-2 py-0.5 backdrop-blur-md border border-white/10">
                      <span className="text-[10px] text-white font-bold truncate max-w-[60px] block">
                        {user.lookingFor || 'Gemini'}
                      </span>
                    </div>
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

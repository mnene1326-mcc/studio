
"use client"

import { useMemo } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Search, Bell } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

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
      <header className="sticky top-0 z-40 bg-white px-4 pt-4 pb-2 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <h1 className="text-xl font-bold font-sans text-black">Recommend</h1>
              <div className="absolute -bottom-1 left-0 w-8 h-1 bg-[#1DB954] rounded-full" />
            </div>
            <button className="text-gray-500 font-medium text-sm">Newcomer</button>
            <button className="text-gray-500 font-medium text-sm">Nearby</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
              <Bell className="w-5 h-5 text-black" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
              <Search className="w-5 h-5 text-black" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-2 lg:max-w-4xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-40">
            <div className="text-xl font-bold">No profiles found</div>
            <p className="text-sm">Try expanding your search settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="relative overflow-hidden border-none rounded-2xl aspect-[3/4.2] group cursor-pointer"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/600`} 
                  alt={user.name}
                  fill
                  className="object-cover"
                  data-ai-hint="person portrait"
                />
                
                {/* Top Right Hi Badge */}
                <div 
                  className="absolute top-2 right-2 bg-[#C6FF00] rounded-lg px-2 py-1 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-black font-black italic text-sm tracking-tighter">Hi</span>
                </div>

                {/* Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-white font-bold text-sm truncate">{user.name}</span>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center scale-75">
                      <span className="text-[6px] text-black font-black">✔</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <div className="bg-[#FF4D94] rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                      <span className="text-[10px] text-white">♀</span>
                      <span className="text-[10px] text-white font-bold">{calculateAge(user.dob)}</span>
                    </div>
                    <div className="bg-[#C6FF00] rounded-md px-1.5 py-0.5">
                      <span className="text-[10px] text-black font-bold">13.6km</span>
                    </div>
                    <div className="bg-black/60 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
                      <span className="text-[10px] text-white font-medium truncate max-w-[50px] block">
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

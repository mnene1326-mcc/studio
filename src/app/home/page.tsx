
"use client"

import { useMemo, useState } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Bell, Search } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<'nearby' | 'recommend'>('recommend')

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('nearby')}
              className={cn(
                "relative text-2xl font-black transition-all",
                activeTab === 'nearby' ? "text-black scale-105" : "text-gray-400"
              )}
            >
              Nearby
              {activeTab === 'nearby' && (
                <div className="absolute -bottom-2 left-0 w-8 h-1.5 bg-[#C6FF00] rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('recommend')}
              className={cn(
                "relative text-2xl font-black transition-all",
                activeTab === 'recommend' ? "text-black scale-105" : "text-gray-400"
              )}
            >
              Recommend
              {activeTab === 'recommend' && (
                <div className="absolute -bottom-2 left-0 w-8 h-1.5 bg-[#C6FF00] rounded-full" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
              <Search className="w-6 h-6 text-black" />
            </Button>
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
            <div className="text-xl font-bold italic">No one here yet...</div>
            <p className="text-sm font-black">Change filters to see more people</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="relative overflow-hidden border-none rounded-[2.5rem] aspect-[3/4.2] group cursor-pointer shadow-xl"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/600`} 
                  alt={user.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  data-ai-hint="person portrait"
                />
                
                {/* "Hi" Quick Action Badge */}
                <div 
                  className="absolute top-4 right-4 bg-[#C6FF00] rounded-2xl px-3 py-1.5 shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-20"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-black font-black italic text-sm tracking-tighter">Hi</span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-white font-black text-lg truncate drop-shadow-md">{user.name}</span>
                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-black font-black">✔</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-[#FF4D94] rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-md">
                      <span className="text-[11px] text-white font-black">♀ {calculateAge(user.dob)}</span>
                    </div>
                    <div className="bg-[#C6FF00] rounded-xl px-2.5 py-1 shadow-md">
                      <span className="text-[11px] text-black font-black">1.2km</span>
                    </div>
                    <div className="bg-white/10 rounded-xl px-2.5 py-1 backdrop-blur-xl border border-white/20">
                      <span className="text-[11px] text-white font-black truncate max-w-[70px] block">
                        {user.lookingFor || 'Dating'}
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

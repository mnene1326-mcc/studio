
"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Target, Search, ShoppingBag, FileText } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  uid: string
  name: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  dob: string
  onboardingComplete: boolean
  interests?: string
}

function calculateAge(dob: string) {
  if (!dob) return 22
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
  const [activeTab, setActiveTab] = useState<'Recommend' | 'Nearby'>('Recommend')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const usersQuery = useMemoFirebase(() => {
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

  if (!isMounted) return null

  return (
    <div className="flex-1 pb-24 bg-white min-h-screen">
      {/* Architectural Header - Perfectly Straight End */}
      <div className="bg-[#FF3B30] pt-2 pb-8">
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] p-4 flex flex-col justify-between h-32 rounded-2xl shadow-lg relative overflow-hidden group active:scale-95 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="bg-white/30 p-2 rounded-2xl backdrop-blur-md">
                  <FileText className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-base leading-none">Mystery Note</h3>
                <p className="text-white/80 text-[9px] font-bold uppercase tracking-widest">Send a note</p>
              </div>
            </div>

            <div 
              onClick={() => router.push('/tasks')}
              className="bg-gradient-to-br from-[#A88CFF] to-[#7B61FF] p-4 flex flex-col justify-between h-32 rounded-2xl shadow-lg relative overflow-hidden group active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="bg-white/30 p-2 rounded-2xl backdrop-blur-md">
                  <Target className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-base leading-none">Task Center</h3>
                <p className="text-white/80 text-[9px] font-bold uppercase tracking-widest">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 px-4 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('Recommend')}
              className={cn(
                "relative text-lg font-black transition-all tracking-tight",
                activeTab === 'Recommend' ? "text-white scale-105" : "text-white/50"
              )}
            >
              Recommend
            </button>
            <button 
              onClick={() => setActiveTab('Nearby')}
              className={cn(
                "relative text-lg font-black transition-all tracking-tight",
                activeTab === 'Nearby' ? "text-white scale-105" : "text-white/50"
              )}
            >
              Nearby
            </button>
          </div>
          <div className="flex items-center gap-5">
             <ShoppingBag className="w-6 h-6 text-white" />
             <Search className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <main className="px-4 pt-8">
        {loading && filteredUsers.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={`skeleton-${i}`} className="aspect-[1/1.2] bg-muted animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
            <p className="font-bold">Finding matches for you...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className="relative overflow-hidden border-none aspect-[1/1.2] rounded-3xl group cursor-pointer shadow-xl premium-shadow"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/480`} 
                  alt={user.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  data-ai-hint="person portrait"
                />
                
                <div 
                  className="absolute top-4 right-4 bg-[#FF3B30] px-5 py-2.5 rounded-full shadow-xl flex items-center justify-center z-20 active:scale-95 transition-transform"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-white font-black text-[10px] tracking-widest uppercase">CHAT</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />

                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-start">
                  <h4 className="text-white font-black text-sm drop-shadow-md truncate leading-none mb-2">{user.name}</h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="bg-[#006400] px-3 py-1 rounded-full text-white font-black text-[10px] leading-none shadow-sm">
                      {calculateAge(user.dob)}
                    </span>
                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-[10px] border border-white/20 leading-none shadow-sm">
                      {user.country || "Kenya"}
                    </span>
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

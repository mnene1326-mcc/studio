
"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Target, RotateCw, FileText, ChevronDown, BadgeCheck, MessageSquare } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: string
  uid: string
  name: string
  photoURL: string
  country: string
  gender: string
  dob: string
  onboardingComplete: boolean
  updatedAt?: any
  isVerified?: boolean
  blocking?: string[]
  blockedBy?: string[]
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
  const { user: currentUser, loading: authLoading } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState<'Recommend' | 'Nearby'>('Recommend')
  const [isMounted, setIsMounted] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [displayLimit, setDisplayLimit] = useState(10)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/welcome")
    }
  }, [currentUser, authLoading, router])

  const currentUserProfileRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef)

  const usersQuery = useMemoFirebase(() => query(
    collection(db, "users"), 
    where("onboardingComplete", "==", true),
    limit(displayLimit + 20)
  ), [db, displayLimit])
  
  const { data: users, loading } = useCollection<UserProfile>(usersQuery)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshSeed(prev => prev + 1)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  const filteredUsers = useMemo(() => {
    if (!users || !currentUserProfile) return []
    
    const blockedList = [...(currentUserProfile.blocking || []), ...(currentUserProfile.blockedBy || [])]
    
    const baseList = users.filter(u => {
      if (u.uid === currentUser?.uid) return false
      if (blockedList.includes(u.uid)) return false
      
      const genderMatch = currentUserProfile.gender === 'male' 
        ? u.gender === 'female' 
        : (currentUserProfile.gender === 'female' ? u.gender === 'male' : true);
      
      if (!genderMatch) return false;

      if (activeTab === 'Nearby') {
        return u.country === currentUserProfile.country;
      }
      
      return true;
    }).slice(0, displayLimit)

    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000

    return [...baseList].sort((a, b) => {
      const aAt = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0
      const bAt = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0
      const aOnline = (now - aAt) < tenMinutes
      const bOnline = (now - bAt) < tenMinutes
      
      if (aOnline && !bOnline) return -1
      if (!aOnline && bOnline) return 1
      
      const seed = refreshSeed || 0;
      return (Math.sin(a.uid.length + seed) - Math.sin(b.uid.length + seed))
    });
  }, [users, currentUser?.uid, currentUserProfile, activeTab, refreshSeed, displayLimit])

  if (!isMounted || authLoading || !currentUser) return null

  return (
    <div className="flex-1 pb-24 bg-white min-h-screen">
      <div className="bg-[#00A2FF] pt-4 pb-4">
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] p-4 flex flex-col justify-between h-32 rounded-2xl shadow-lg cursor-pointer">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><FileText className="w-6 h-6 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm">Mystery Note</h3>
                <p className="text-white/80 text-[9px] font-bold uppercase tracking-widest">Send a note</p>
              </div>
            </div>

            <div onClick={() => router.push('/tasks')} className="bg-gradient-to-br from-[#A88CFF] to-[#7B61FF] p-4 flex flex-col justify-between h-32 rounded-2xl shadow-lg cursor-pointer">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><Target className="w-6 h-6 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm">Task Center</h3>
                <p className="text-white/80 text-[9px] font-bold uppercase tracking-widest">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-1 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setActiveTab('Recommend'); setDisplayLimit(10); }} 
              className={cn("text-base font-black transition-all", activeTab === 'Recommend' ? "text-white scale-105" : "text-white/50")}
            >
              Recommend
            </button>
            <button 
              onClick={() => { setActiveTab('Nearby'); setDisplayLimit(10); }} 
              className={cn("text-base font-black transition-all", activeTab === 'Nearby' ? "text-white scale-105" : "text-white/50")}
            >
              Nearby
            </button>
          </div>
          <div className="flex items-center text-white">
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className={cn("p-2 transition-all active:scale-90", isRefreshing && "animate-spin opacity-50")}
            >
              <RotateCw className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <main className="px-4 pt-6">
        {(loading || isRefreshing) && filteredUsers.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[1/1.2] bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
            <RotateCw className="w-12 h-12" />
            <p className="font-black text-sm uppercase tracking-widest">No users found</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              {filteredUsers.map((user, idx) => {
                const now = Date.now()
                const tenMinutes = 10 * 60 * 1000
                const userAt = user.updatedAt?.seconds ? user.updatedAt.seconds * 1000 : 0
                const isOnline = (now - userAt) < tenMinutes

                return (
                  <Card 
                    key={`${user.uid}-${refreshSeed}-${idx}`} 
                    className="relative overflow-hidden border-none aspect-[1/1.2] rounded-3xl group cursor-pointer shadow-xl" 
                    onClick={() => router.push(`/users/${user.uid}`)}
                  >
                    <Image 
                      src={user.photoURL} 
                      alt={user.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105" 
                      data-ai-hint="person profile"
                    />
                    
                    {isOnline && (
                      <div className="absolute top-4 left-4 z-20 w-3 h-3 rounded-full bg-green-500 border-2 border-white/50 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    )}

                    {user.isVerified && (
                      <div className="absolute top-4 left-10 z-20">
                         <BadgeCheck className="w-4 h-4 text-blue-400 fill-white" />
                      </div>
                    )}

                    <div 
                      className="absolute top-4 right-4 bg-[#00A2FF] px-4 py-2 rounded-full z-30 text-white font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/chats?startWith=${user.uid}`);
                      }}
                    >
                      <MessageSquare className="w-3.1 h-3.1 fill-current" />
                      CHAT
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <h4 className="text-white font-black text-sm truncate">{user.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#006400] px-3 py-1 rounded-full text-white font-black text-[10px]">{calculateAge(user.dob)}</span>
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-[10px] border border-white/20">{user.country || "Kenya"}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
            
            {users.length >= displayLimit && (
              <div className="flex justify-center pb-8">
                <Button 
                  variant="ghost" 
                  className="text-gray-400 font-black text-[10px] uppercase tracking-widest gap-2"
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                >
                  <ChevronDown className="w-4 h-4" />
                  Show more
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

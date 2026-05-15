
"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit, doc, getDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Target, RotateCw, FileText, ChevronDown, BadgeCheck } from "lucide-react"
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

  // Check authentication and onboarding status
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.replace("/welcome")
      } else {
        const checkStatus = async () => {
          const userRef = doc(db, "users", currentUser.uid)
          const snap = await getDoc(userRef)
          if (!snap.exists() || !snap.data().onboardingComplete) {
            router.replace("/onboarding")
          }
        }
        checkStatus()
      }
    }
  }, [currentUser, authLoading, router, db])

  const currentUserProfileRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef)

  const usersQuery = useMemoFirebase(() => query(
    collection(db, "users"), 
    where("onboardingComplete", "==", true),
    limit(50) // Fetch enough for filtering
  ), [db])
  
  const { data: users, loading } = useCollection<UserProfile>(usersQuery)

  // --- Scroll Restoration Logic ---
  useEffect(() => {
    if (!isMounted) return
    const handleScroll = () => {
      sessionStorage.setItem('home_scroll_pos', window.scrollY.toString())
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMounted])

  useEffect(() => {
    if (!loading && users.length > 0 && isMounted) {
      const savedPos = sessionStorage.getItem('home_scroll_pos')
      if (savedPos) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: parseInt(savedPos), behavior: 'instant' })
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [loading, users.length, isMounted])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshSeed(prev => prev + 1)
    sessionStorage.removeItem('home_scroll_pos')
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
      const genderMatch = currentUserProfile.gender === 'male' ? u.gender === 'female' : (currentUserProfile.gender === 'female' ? u.gender === 'male' : true);
      if (!genderMatch) return false;
      if (activeTab === 'Nearby') return u.country === currentUserProfile.country;
      return true;
    })
    
    const seed = refreshSeed || 0;
    const sorted = [...baseList].sort((a, b) => (Math.sin(a.uid.length + seed) - Math.sin(b.uid.length + seed)));
    return sorted;
  }, [users, currentUser?.uid, currentUserProfile, activeTab, refreshSeed])

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(0, displayLimit);
  }, [filteredUsers, displayLimit]);

  const hasMore = paginatedUsers.length < filteredUsers.length;

  if (!isMounted || authLoading || !currentUser) return null

  return (
    <div className="flex-1 pb-24 bg-[#F9FAFB] min-h-screen relative">
      <div className="absolute top-0 left-0 right-0 z-0 flex flex-col">
        <div className="h-[72px] bg-[#00A2FF] relative overflow-hidden">
          <div className="absolute -right-4 -top-10 rotate-[-12deg] opacity-20 select-none pointer-events-none">
            <span className="text-7xl font-logo text-white whitespace-nowrap">MatchFlow</span>
          </div>
        </div>
        <div className="h-[120px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]" />
      </div>
      
      <div className="relative z-10 pt-0">
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] p-4 flex flex-col justify-between h-28 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><FileText className="w-5 h-5 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm">Mystery Note</h3>
                <p className="text-white/80 text-[8px] font-bold uppercase tracking-widest">Send a note</p>
              </div>
            </div>

            <div onClick={() => router.push('/tasks')} className="bg-gradient-to-br from-[#A88CFF] to-[#7B61FF] p-4 flex flex-col justify-between h-28 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><Target className="w-5 h-5 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm">Task Center</h3>
                <p className="text-white/80 text-[8px] font-bold uppercase tracking-widest">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-[#F9FAFB]/90 backdrop-blur-md px-5 pt-3 pb-3 flex items-center justify-between border-b border-black/5 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('Recommend')} className={cn("text-sm font-black transition-all", activeTab === 'Recommend' ? "text-[#00A2FF]" : "text-gray-400")}>Recommend</button>
            <button onClick={() => setActiveTab('Nearby')} className={cn("text-sm font-black transition-all", activeTab === 'Nearby' ? "text-[#00A2FF]" : "text-gray-400")}>Nearby</button>
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing} className={cn("p-1.5 text-[#00A2FF]", isRefreshing && "animate-spin opacity-50")}>
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <main className="px-4 pt-3">
          {loading && paginatedUsers.length === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[1/1.2] bg-muted animate-pulse rounded-3xl" />)}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {paginatedUsers.map((user) => (
                  <Card key={user.uid} className="relative overflow-hidden border-none aspect-[1/1.2] rounded-2xl group cursor-pointer shadow-xl bg-white" onClick={() => router.push(`/users/${user.uid}`)}>
                    <Image src={user.photoURL} alt={user.name} fill className="object-cover" data-ai-hint="person profile" />
                    <div className="absolute top-2.5 right-2.5 bg-[#00A2FF] px-4 py-1.5 rounded-full z-30 text-white font-black text-[12px] uppercase shadow-md" onClick={(e) => { e.stopPropagation(); router.push(`/chats?startWith=${user.uid}`); }}>CHAT</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-white font-black text-[18px] truncate tracking-tight">{user.name}</h4>
                        {user.isVerified && <BadgeCheck className="w-4 h-4 text-[#00A2FF] fill-white shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="bg-[#006400] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full">{calculateAge(user.dob)}</span>
                        <span className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] border border-white/20 truncate">{user.country || "Kenya"}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pb-8">
                  <Button variant="ghost" className="text-gray-400 font-black text-[9px] uppercase tracking-widest gap-2" onClick={() => setDisplayLimit(prev => prev + 10)}>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show more
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

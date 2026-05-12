"use client"

import { useMemo, use } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MapPin, Heart, Calendar, Users, MessageSquare, ShieldCheck, BadgeCheck } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  dob: string
  interests?: string
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const db = useFirestore()

  const userRef = useMemo(() => doc(db, "users", userId), [db, userId])
  const { data: profile, loading } = useDoc<UserProfile>(userRef)

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="animate-pulse font-headline text-primary text-3xl">Curating Excellence...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="p-12 bg-white rounded-full shadow-2xl">
          <Heart className="w-16 h-16 text-muted-foreground/20" />
        </div>
        <p className="text-xl font-headline text-muted-foreground">This profile is currently unavailable.</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full px-12 h-14 text-lg">Return to Search</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen pb-32">
      <div className="relative h-[75vh] w-full lg:max-w-3xl lg:mx-auto lg:mt-8 lg:rounded-[4rem] lg:overflow-hidden lg:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)]">
        <Image
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/800/1000`}
          alt={profile.name}
          fill
          className="object-cover"
          data-ai-hint="person portrait"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 rounded-2xl premium-blur w-12 h-12 text-black shadow-xl hover:bg-white/80 transition-all active:scale-90"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        <div className="absolute top-8 right-8 premium-blur rounded-2xl px-5 py-2.5 flex items-center gap-2 text-black shadow-xl border border-white/40">
          <ShieldCheck className="w-5 h-5 text-[#FF3B30]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Elite</span>
        </div>
      </div>

      <main className="px-8 -mt-24 relative z-10 space-y-10 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-6xl font-black text-black leading-tight tracking-tighter">
                {profile.name}{profile.dob ? `, ${calculateAge(profile.dob)}` : ""}
              </h1>
              <BadgeCheck className="w-10 h-10 text-[#FF3B30] mt-1" />
            </div>
            
            <div className="flex items-center gap-8 text-black/40 text-sm font-black uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FF3B30]" /> 
                {profile.country}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF3B30]" /> 
                {profile.gender}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="rounded-2xl px-6 py-3 bg-[#FF3B30]/5 text-[#FF3B30] border-none font-black text-xs tracking-[0.1em] uppercase shadow-sm">
              Seeking: {profile.lookingFor}
            </Badge>
          </div>
        </div>

        <section className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-black/5 border border-black/5 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#FF3B30] rounded-full"></div>
            <h3 className="font-black text-3xl text-black italic tracking-tighter leading-none">About Me</h3>
          </div>
          
          <div className="space-y-6">
            {profile.interests ? (
              <p className="text-xl font-body text-black/70 leading-relaxed italic border-l-4 border-red-50 pl-6">
                "{profile.interests}"
              </p>
            ) : (
              <p className="text-lg font-body text-black/30 italic">
                This user prefers to keep their biography a mystery.
              </p>
            )}
            
            <div className="grid grid-cols-1 gap-6 pt-8 border-t border-black/5">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-red-50 rounded-[1.5rem] shadow-inner">
                  <Calendar className="w-6 h-6 text-[#FF3B30]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 font-black">Date of Birth</p>
                  <p className="font-headline text-xl text-black font-bold">{profile.dob || "Undisclosed"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-10 left-8 right-8 z-50 flex justify-center">
        <Button 
          className="w-full max-w-md h-20 rounded-[2.5rem] text-2xl font-black shadow-[0_20px_40px_-10px_rgba(255,59,48,0.4)] flex items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 bg-[#FF3B30] hover:bg-red-600 group"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          Message {profile.name}
        </Button>
      </div>
    </div>
  )
}
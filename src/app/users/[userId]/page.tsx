"use client"

import { useMemo, use } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MapPin, Heart, Calendar, Users, MessageSquare, ShieldCheck } from "lucide-react"
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
        <div className="animate-pulse font-headline text-primary text-2xl">Refining Profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="p-8 bg-white rounded-full shadow-lg">
          <Heart className="w-12 h-12 text-muted" />
        </div>
        <p className="text-muted-foreground font-body">This profile has set sail.</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full px-8 h-12">Return Home</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background flex flex-col min-h-screen pb-32">
      <div className="relative h-[70vh] w-full lg:max-w-2xl lg:mx-auto lg:mt-8 lg:rounded-[3rem] lg:overflow-hidden lg:shadow-2xl">
        <Image
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/600/800`}
          alt={profile.name}
          fill
          className="object-cover"
          data-ai-hint="person portrait"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="absolute top-6 left-6 rounded-full premium-blur text-white shadow-lg hover:bg-black/40"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="absolute top-6 right-6 premium-blur rounded-full px-4 py-2 flex items-center gap-2 text-white shadow-lg">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-headline uppercase tracking-widest">Verified</span>
        </div>
      </div>

      <main className="px-6 -mt-24 relative z-10 space-y-8 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-5xl font-headline text-primary leading-tight">
              {profile.name}{profile.dob ? `, ${calculateAge(profile.dob)}` : ""}
            </h1>
            <div className="flex items-center gap-6 text-foreground/60 text-sm font-body">
              <span className="flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-primary" /> 
                {profile.country}
              </span>
              <span className="capitalize flex items-center gap-2 font-medium">
                <Users className="w-4 h-4 text-primary" /> 
                {profile.gender}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-5 py-2 bg-primary/5 text-primary border-none font-headline text-xs tracking-widest uppercase">
              Looking for {profile.lookingFor}
            </Badge>
          </div>
        </div>

        <section className="bg-white rounded-[2rem] p-8 shadow-xl border-none space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            <h3 className="font-headline text-2xl text-primary">About</h3>
          </div>
          <div className="space-y-4">
            {profile.interests ? (
              <p className="text-lg font-body text-foreground/80 leading-relaxed italic">
                "{profile.interests}"
              </p>
            ) : (
              <p className="text-sm font-body text-muted-foreground italic">
                No biography added yet.
              </p>
            )}
            
            <div className="grid grid-cols-1 gap-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/30 rounded-2xl">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Birth Date</p>
                  <p className="font-body text-foreground">{profile.dob || "Private"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-8 left-6 right-6 z-50 flex justify-center">
        <Button 
          className="w-full max-w-sm h-16 rounded-full text-xl font-headline shadow-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-6 h-6" />
          Message {profile.name}
        </Button>
      </div>
    </div>
  )
}

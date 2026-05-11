"use client"

import { useMemo, use } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MapPin, Heart, Calendar, Users, MessageSquare } from "lucide-react"
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
        <div className="animate-pulse font-headline text-primary text-xl">Loading Profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-muted-foreground">User not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background flex flex-col min-h-screen pb-24">
      <div className="relative h-[60vh] w-full">
        <Image
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/600/800`}
          alt={profile.name}
          fill
          className="object-cover"
          data-ai-hint="person portrait"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="absolute top-4 left-4 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>

      <main className="px-6 -mt-20 relative z-10 space-y-6">
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <h1 className="text-4xl font-headline text-primary">
              {profile.name}{profile.dob ? `, ${calculateAge(profile.dob)}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-sm font-body">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.country}</span>
            <span className="capitalize flex items-center gap-1"><Users className="w-4 h-4" /> {profile.gender}</span>
          </div>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
          <h3 className="font-headline text-xl text-primary">About</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-4 py-1 bg-accent/10 text-primary border-none font-body">
              Looking for {profile.lookingFor}
            </Badge>
            {profile.dob && (
              <Badge variant="outline" className="rounded-full px-4 py-1 font-body">
                Born {profile.dob}
              </Badge>
            )}
          </div>
          {profile.interests && (
            <div className="space-y-2">
              <p className="text-sm font-body text-foreground leading-relaxed">
                {profile.interests}
              </p>
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 left-6 right-6 z-50">
        <Button 
          className="w-full h-14 rounded-full text-lg font-headline shadow-xl flex items-center justify-center gap-2"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-5 h-5" />
          Message {profile.name}
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { BottomNav } from "@/components/layout/BottomNav"
import { Mic2, Users, Flame, ChevronRight, Loader2, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createPartyRoomAction } from "@/app/actions/party"

interface Room {
  id: string
  name: string
  hostName: string
  hostPhoto: string
  onlineCount: number
  hot: string
}

export default function PartyLobbyPage() {
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [roomName, setRoomName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch real rooms from Firestore
  const roomsQuery = useMemo(() => query(
    collection(db, "rooms"),
    orderBy("createdAt", "desc"),
    limit(20)
  ), [db])

  const { data: rooms, loading: roomsLoading } = useCollection<Room>(roomsQuery)

  const handleCreateRoom = async () => {
    if (!user || !roomName.trim()) return
    
    setIsCreating(true)
    try {
      const res = await createPartyRoomAction(user.uid, roomName.trim())
      if (res.success && res.roomId) {
        setIsDialogOpen(false)
        router.push(`/party/${res.roomId}`)
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex-1 bg-white min-h-screen pb-24 select-none overflow-y-auto no-scrollbar">
      <header className="px-6 pt-12 pb-6 border-b sticky top-0 bg-white z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-black tracking-tight">Party</h1>
          <div className="bg-blue-50 p-2 rounded-2xl">
            <Mic2 className="w-5 h-5 text-[#00A2FF]" />
          </div>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live Voice Rooms</p>
      </header>

      <main className="p-6 space-y-8">
        <div className="bg-gradient-to-br from-[#00A2FF] to-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl font-bold">Start Your Party</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Voice & Games Center</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="relative z-10 bg-white text-[#00A2FF] px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Create
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl p-8 max-w-[90vw] select-none">
              <DialogHeader className="items-center text-center">
                <DialogTitle className="text-xl font-bold">New Party Room</DialogTitle>
                <p className="text-xs text-gray-400 font-medium">Give your room a catchy name!</p>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <Input 
                  placeholder="e.g. Jam on the Rocks 🎸" 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)} 
                  className="rounded-2xl h-16 text-center text-lg font-bold border-gray-100 bg-gray-50 focus:bg-white"
                  maxLength={25}
                />
                <Button 
                  onClick={handleCreateRoom} 
                  disabled={isCreating || !roomName.trim()} 
                  className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {isCreating ? <Loader2 className="animate-spin" /> : "Start Now"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Active Rooms</h3>
            <button className="text-[9px] font-bold text-[#00A2FF] uppercase tracking-widest flex items-center gap-1">
              Explore All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {roomsLoading ? (
            <div className="flex justify-center py-20 opacity-20"><Loader2 className="w-10 h-10 animate-spin" /></div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Mic2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">No active parties</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rooms.map((room) => (
                <Card 
                  key={room.id} 
                  onClick={() => router.push(`/party/${room.id}`)}
                  className="overflow-hidden rounded-[1.8rem] border-none shadow-md bg-gray-50 flex active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <div className="relative w-32 h-32 shrink-0">
                    <Image 
                      src={room.hostPhoto || "https://picsum.photos/seed/party/400/400"} 
                      alt={room.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-white uppercase tracking-tighter">{room.onlineCount || 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-[15px] text-black truncate leading-tight">{room.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Host: {room.hostName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px] font-black tracking-tighter">{room.hot || "0"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black tracking-tighter uppercase">Live</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

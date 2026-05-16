
"use client"

import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { Mic2, Users, Flame, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"

const PARTY_ROOMS = [
  { id: 1001, name: "Jam on the Rocks", host: "Rey nimo", online: 16, hot: "36.0K", image: "https://picsum.photos/seed/party1/400/400" },
  { id: 1002, name: "Sunset Vibes", host: "Adrianah", online: 24, hot: "12.5K", image: "https://picsum.photos/seed/party2/400/400" },
  { id: 1003, name: "Nairobi Nights", host: "The Boy", online: 42, hot: "89.2K", image: "https://picsum.photos/seed/party3/400/400" },
  { id: 1004, name: "Afrobeat Lounge", host: "King King", online: 8, hot: "2.1K", image: "https://picsum.photos/seed/party4/400/400" },
]

export default function PartyLobbyPage() {
  const router = useRouter()

  return (
    <div className="flex-1 bg-white min-h-screen pb-20 select-none">
      <header className="px-6 pt-12 pb-6 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-black tracking-tight">Party</h1>
          <div className="bg-blue-50 p-2 rounded-2xl">
            <Mic2 className="w-5 h-5 text-[#00A2FF]" />
          </div>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live Voice Rooms</p>
      </header>

      <main className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-[#00A2FF] to-blue-600 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Start Your Party</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Voice & Games Center</p>
          </div>
          <button className="bg-white text-[#00A2FF] px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
            Create
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Popular Rooms</h3>
            <button className="text-[9px] font-bold text-[#00A2FF] uppercase tracking-widest flex items-center gap-1">
              Explore All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {PARTY_ROOMS.map((room) => (
              <Card 
                key={room.id} 
                onClick={() => router.push(`/party/${room.id}`)}
                className="overflow-hidden rounded-[1.5rem] border-none shadow-md bg-gray-50 flex active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="relative w-28 h-28 shrink-0">
                  <Image src={room.image} alt={room.name} fill className="object-cover" />
                  <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-white uppercase">{room.online}</span>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-black truncate">{room.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Host: {room.host}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-black tracking-tighter">{room.hot}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] font-black tracking-tighter">Voice On</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

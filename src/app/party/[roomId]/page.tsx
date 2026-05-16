"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, onSnapshot } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { 
  X, 
  ShoppingBag, 
  Heart, 
  Mic, 
  MicOff, 
  MessageSquare, 
  LayoutGrid, 
  Gift as GiftIcon,
  Crown,
  Gamepad2,
  Users,
  Smile,
  Trophy,
  Loader2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getTRTCCredentials } from "@/app/actions/trtc"
import { trtcService } from "@/lib/trtc-service"
import { useToast } from "@/hooks/use-toast"

interface ChatMessage {
  id: string
  user: string
  text: string
  isSystem?: boolean
  vip?: string
  avatar?: string
}

interface RoomData {
  id: string
  name: string
  ownerUid: string
  hostName: string
  hostPhoto: string
  onlineCount: number
}

const DUMMY_CHATS: ChatMessage[] = [
  { id: '1', user: 'System', text: 'Respect others and chat politely. Let\'s have fun together!', isSystem: true },
  { id: '3', user: 'MCC 😐', text: 'Entered the room', isSystem: true, vip: 'SVIP1' },
  { 
    id: '4', 
    user: 'Adriannah 🤤', 
    text: 'hello baby...welcome to this platform reply@', 
    vip: 'VIP2',
    avatar: 'https://picsum.photos/seed/u5/100/100'
  },
]

export default function PartyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [room, setRoom] = useState<RoomData | null>(null)
  const [isMicOn, setIsMicOn] = useState(false)
  const [activeTab, setActiveTab] = useState<'All' | 'Chat'>('All')
  const [isConnecting, setIsConnecting] = useState(true)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch Room Details
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (snap.exists()) {
        setRoom(snap.data() as RoomData)
      } else {
        toast({ variant: "destructive", title: "Error", description: "Room not found" })
        router.push("/party")
      }
      setLoading(false)
    })
    return () => unsub()
  }, [db, roomId, router, toast])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // TRTC Integration Logic
  useEffect(() => {
    if (!user?.uid) return;

    const startVoice = async () => {
      const res = await getTRTCCredentials(user.uid);
      if (res.success && res.sdkAppId && res.userSig) {
        await trtcService.init({
          sdkAppId: res.sdkAppId,
          userId: res.userId,
          userSig: res.userSig
        });
        await trtcService.join(Number(roomId));
        setIsConnecting(false);
      } else {
        console.warn("TRTC Config missing. Check Vercel environment variables.");
        setIsConnecting(false);
      }
    };

    startVoice();
    return () => { trtcService.leave(); };
  }, [user?.uid, roomId]);

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    trtcService.toggleMic(newState);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#00A2FF] animate-spin" />
    </div>
  )

  const occupied = [
    { seat: 0, user: room?.hostName || 'Host', photo: room?.hostPhoto || '', hot: 7, frame: 'gold' },
    { seat: 1, user: 'Breeh 💋...', photo: 'https://picsum.photos/seed/u2/100/100', hot: 0, frame: 'silver' },
    { seat: 4, user: 'anitah 💖😋', photo: 'https://picsum.photos/seed/u3/100/100', hot: 3, frame: 'silver' },
    { seat: 9, user: 'THE BOY🤤', photo: 'https://picsum.photos/seed/u4/100/100', hot: '36.0K', frame: 'gold' },
    { seat: 10, user: 'Adriannah...', photo: 'https://picsum.photos/seed/u5/100/100', hot: 463, frame: 'gold' },
  ]

  return (
    <div className="fixed inset-0 bg-black flex flex-col select-none overflow-hidden font-sans text-white">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7A0D0D] via-[#3D0808] to-[#1A0505] opacity-95" />
        <Image 
          src="https://picsum.photos/seed/party-bg/1000/1500" 
          alt="room bg" 
          fill 
          className="object-cover opacity-20 grayscale brightness-50 mix-blend-overlay"
          priority
        />
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full pl-1.5 pr-4 py-1.5 border border-white/10 shadow-xl">
          <Avatar className="w-9 h-9 border-2 border-white/20">
            <AvatarImage src={room?.hostPhoto} />
            <AvatarFallback>{room?.hostName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-white text-[11px] font-black truncate max-w-[100px] leading-tight tracking-tight">{room?.name}</h1>
            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">ID:{roomId}</p>
          </div>
          <button className="bg-[#56E39F] rounded-full p-1.5 shadow-lg active:scale-95 transition-all ml-1.5">
            <Heart className="w-3.5 h-3.5 text-white fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isConnecting && <div className="text-[8px] font-black uppercase text-[#56E39F] animate-pulse">Initializing...</div>}
          <button className="text-white/80 p-2 bg-white/10 rounded-full border border-white/10 active:scale-95"><ShoppingBag className="w-4.5 h-4.5" /></button>
          <button onClick={() => router.back()} className="text-white/80 p-2 bg-white/10 rounded-full border border-white/10 active:scale-95"><X className="w-4.5 h-4.5" /></button>
        </div>
      </header>

      {/* Stats row */}
      <div className="relative z-20 px-5 flex items-center gap-3 mb-8 mt-2">
        <div className="flex -space-x-2 items-center">
          <Trophy className="w-4 h-4 text-yellow-500 mr-2.5" />
          {[1, 2, 3].map(i => (
            <Avatar key={i} className="w-5.5 h-5.5 border-2 border-white/20 shadow-md">
              <AvatarImage src={`https://picsum.photos/seed/p${i}/100/100`} />
            </Avatar>
          ))}
        </div>
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-inner">
          <Users className="w-3 h-3 text-[#56E39F]" />
          <span className="text-white text-[10px] font-black tracking-tight">{room?.onlineCount || 1}</span>
        </div>
      </div>

      {/* Seats Grid */}
      <main className="relative z-20 flex-1 px-3 overflow-y-auto no-scrollbar pb-40">
        <div className="grid grid-cols-5 gap-y-12 gap-x-1">
          {Array.from({ length: 20 }).map((_, idx) => {
            const userSeat = occupied.find(u => u.seat === idx)
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="relative">
                  {userSeat ? (
                    <>
                      <div className={cn(
                        "w-14 h-14 rounded-full overflow-hidden border-2 relative z-10 p-0.5",
                        userSeat.frame === 'gold' ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-blue-400'
                      )}>
                        <Image src={userSeat.photo} alt={userSeat.user} fill className="object-cover p-1 rounded-full" />
                      </div>
                      <div className="absolute -bottom-2.5 inset-x-0 flex justify-center z-30">
                        <div className="bg-[#417505] px-2 py-0.5 rounded-full border border-white/20 shadow-lg scale-75">
                          <span className="text-white text-[9px] font-black leading-none">{userSeat.hot}</span>
                        </div>
                      </div>
                      <div className="absolute -top-6 -left-1.5 z-20 scale-125 rotate-[-15deg]">
                         <Crown className={cn("w-6 h-6 drop-shadow-md", userSeat.frame === 'gold' ? 'text-amber-400 fill-amber-400' : 'text-blue-300 fill-blue-300')} />
                      </div>
                    </>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-black/40 border-2 border-white/5 flex items-center justify-center shadow-inner group active:bg-white/10 transition-colors cursor-pointer">
                      <span className="text-white/20 font-black text-[10px] group-hover:text-white/40">{idx + 1}</span>
                    </div>
                  )}
                </div>
                <span className="text-white text-[9px] font-bold truncate w-full text-center px-1 tracking-tighter opacity-70 uppercase">
                  {userSeat ? userSeat.user : "Seat"}
                </span>
              </div>
            )
          })}
        </div>

        {/* Chat Area */}
        <div className="mt-12 space-y-4 pr-12">
          <div className="flex gap-8 border-b border-white/10 mb-4 px-1">
            {['All', 'Chat'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "pb-2.5 text-[11px] font-black uppercase tracking-[0.25em] transition-all",
                  activeTab === tab ? "text-amber-400 border-b-2 border-amber-400" : "text-white/30"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="space-y-3.5 max-h-48 overflow-y-auto no-scrollbar pb-6">
            {DUMMY_CHATS.map((chat) => (
              <div key={chat.id} className="animate-in slide-in-from-left-4 duration-500">
                {chat.isSystem ? (
                  <div className="bg-black/15 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-white/5">
                    <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                      <span className="font-black text-amber-200 uppercase tracking-tighter mr-1">{chat.user}:</span> {chat.text}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl px-4 py-2.5 inline-block border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-blue-300 font-black text-[10px] uppercase tracking-tighter">{chat.user}</span>
                      <span className="text-[8px] font-black bg-blue-500/20 text-blue-300 px-1.5 rounded uppercase tracking-widest">{chat.vip}</span>
                    </div>
                    <p className="text-xs text-white/90 font-medium leading-relaxed">
                      {chat.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Control Bar */}
      <footer className="relative z-30 p-4 pb-8 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center gap-3">
        <div className="flex-1 bg-white/10 backdrop-blur-3xl rounded-full h-12 flex items-center px-5 border border-white/10 shadow-inner group">
          <input 
            placeholder="Say something..." 
            className="bg-transparent border-none outline-none text-white text-[13px] font-medium flex-1 placeholder:text-white/40"
          />
          <Smile className="w-5.5 h-5.5 text-white/40 group-focus-within:text-amber-400 transition-colors" />
        </div>

        <button className="w-12 h-12 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform"><Gamepad2 className="w-6 h-6" /></button>
        <button className="w-12 h-12 bg-[#FFD600] rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,214,0,0.4)] active:scale-90 transition-transform"><GiftIcon className="w-6 h-6 fill-current" /></button>

        <button 
          onClick={toggleMic}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/10 backdrop-blur-md",
            isMicOn ? "bg-[#56E39F] text-white shadow-[0_0_15px_rgba(86,227,159,0.3)]" : "bg-white/10 text-white/40"
          )}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button className="w-12 h-12 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center text-white relative border border-white/10 active:scale-90 transition-transform">
          <MessageSquare className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 bg-[#FF4B4B] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-black">99+</div>
        </button>

        <button className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform"><LayoutGrid className="w-6 h-6" /></button>
      </footer>
      
      {/* Hidden Audio Container for TRTC */}
      <div id="remote-audio-container" className="hidden" />
    </div>
  )
}

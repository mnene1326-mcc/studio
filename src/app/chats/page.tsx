
"use client"

import { useEffect, useState, Suspense, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { doc, getDocs, collection, query, where, updateDoc, getDoc, serverTimestamp, orderBy, limit, addDoc } from "firebase/firestore"
import { ref, onValue, push, set, update, increment as rtdbIncrement, limitToLast, query as rtdbQuery, get, onDisconnect } from "firebase/database"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, useDatabase } from "@/firebase"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { 
  Send, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  Lock,
  Trash2,
  Circle,
  BadgeCheck,
  Gift as GiftIcon,
  Coins,
  ChevronRight,
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useUserPresence } from "@/hooks/use-presence"

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: number
  isGift?: boolean
}

interface Chat {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: any
  createdAt: any
  clearedAt?: Record<string, any>
  maleMessageCount?: number
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  gender?: string
  blocking?: string[]
  blockedBy?: string[]
  isAdmin?: boolean
  isCoinSeller?: boolean
  isVerified?: boolean
}

const GIFTS = [
  { id: '2026', name: '2026', price: 20, icon: '🎆' },
  { id: 'heart', name: 'Heart', price: 150, icon: '❤️' },
  { id: 'e-heart', name: 'Electric heart', price: 500, icon: '⚡' },
  { id: 'flower', name: 'Flower diamond', price: 25990, icon: '💎' },
  { id: 'nigeria', name: 'Nigeria', price: 300, icon: '🇳🇬' },
  { id: 'butterfly', name: 'Shiny Butterfly', price: 500, icon: '🦋' },
  { id: 'necklace', name: 'Gold Necklace', price: 1500, icon: '📿' },
  { id: 'parrot', name: 'Flying Parrot', price: 500, icon: '🦜' },
  { id: 'drum', name: 'African drum', price: 300, icon: '🪘' },
  { id: 'harley', name: 'Harley Motors', price: 3000, icon: '🏍️' },
  { id: 'dress', name: 'Dress', price: 800, icon: '👗' },
  { id: 'phone', name: 'Antique Telephone', price: 400, icon: '☎️' },
]

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

function CallInterface({ 
  chatId, 
  currentUser, 
  partner, 
  callType, 
  onClose 
}: { 
  chatId: string, 
  currentUser: any, 
  partner: UserProfile, 
  callType: 'voice' | 'video',
  onClose: () => void 
}) {
  const rtdb = useDatabase()
  const { toast } = useToast()
  const [callState, setCallState] = useState<'initiating' | 'ringing' | 'connected' | 'ended'>('initiating')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice')
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true
        })
        localStream.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        peerConnection.current = new RTCPeerConnection(RTC_CONFIG)
        
        stream.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, stream)
        })

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
          setCallState('connected')
        }

        const callRef = ref(rtdb, `calls/${chatId}`)
        
        // Check for incoming call
        const snapshot = await get(callRef)
        const callData = snapshot.val()

        if (callData && callData.callerId !== currentUser.uid && callData.status === 'initiating') {
          // Join Call
          setCallState('ringing')
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callData.offer))
          const answer = await peerConnection.current.createAnswer()
          await peerConnection.current.setLocalDescription(answer)
          await update(callRef, { answer, status: 'connected' })
        } else {
          // Initiate Call
          const offer = await peerConnection.current.createOffer()
          await peerConnection.current.setLocalDescription(offer)
          await set(callRef, {
            offer,
            callerId: currentUser.uid,
            type: callType,
            status: 'initiating',
            timestamp: serverTimestamp()
          })
          
          onValue(callRef, (snap) => {
            const data = snap.val()
            if (data?.answer && callState === 'initiating') {
              peerConnection.current?.setRemoteDescription(new RTCSessionDescription(data.answer))
            }
            if (data?.status === 'ended') endCall()
          })
        }

        // Handle ICE Candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            const candidatesRef = ref(rtdb, `calls/${chatId}/candidates/${currentUser.uid}`)
            push(candidatesRef, event.candidate.toJSON())
          }
        }

        const otherUserId = partner.uid
        onValue(ref(rtdb, `calls/${chatId}/candidates/${otherUserId}`), (snap) => {
          snap.forEach((child) => {
            peerConnection.current?.addIceCandidate(new RTCIceCandidate(child.val()))
          })
        })

        onDisconnect(callRef).update({ status: 'ended' })

      } catch (err) {
        toast({ variant: "destructive", title: "Call Error", description: "Camera or Mic access denied." })
        onClose()
      }
    }

    startCall()

    return () => {
      endCall()
    }
  }, [])

  const endCall = () => {
    localStream.current?.getTracks().forEach(track => track.stop())
    peerConnection.current?.close()
    update(ref(rtdb, `calls/${chatId}`), { status: 'ended' })
    onClose()
  }

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      audioTrack.enabled = !audioTrack.enabled
      setIsMuted(!audioTrack.enabled)
    }
  }

  const toggleVideo = () => {
    if (localStream.current && callType === 'video') {
      const videoTrack = localStream.current.getVideoTracks()[0]
      videoTrack.enabled = !videoTrack.enabled
      setIsVideoOff(!videoTrack.enabled)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between p-8 text-white">
      <div className="w-full flex flex-col items-center gap-4 mt-12">
        <Avatar className="w-24 h-24 border-4 border-white/10">
          <AvatarImage src={partner.photoURL} />
          <AvatarFallback>{partner.name[0]}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{partner.name}</h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
            {callState === 'initiating' ? 'Calling...' : (callState === 'ringing' ? 'Ringing...' : 'Connected')}
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-sm flex-1 flex items-center justify-center">
        {callType === 'video' && (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover rounded-[3rem] bg-gray-900 shadow-2xl" 
          />
        )}
        <div className={cn(
          "absolute bottom-4 right-4 w-32 aspect-[3/4] bg-black border-2 border-white/20 rounded-2xl overflow-hidden shadow-xl transition-all",
          callType === 'voice' && "hidden"
        )}>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="w-full max-w-sm flex items-center justify-around pb-12">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMute}
          className={cn("w-16 h-16 rounded-full", isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white")}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={endCall}
          className="w-20 h-20 rounded-full bg-red-600 text-white shadow-2xl"
        >
          <PhoneOff className="w-8 h-8" />
        </Button>

        {callType === 'video' && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleVideo}
            className={cn("w-16 h-16 rounded-full", isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white")}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        )}
      </div>
    </div>
  )
}

function ChatListItem({ chat, currentUserUid, blocking, blockedBy, onDelete }: { chat: Chat, currentUserUid: string, blocking: string[], blockedBy: string[], onDelete: (chat: Chat) => void }) {
  const router = useRouter()
  const db = useFirestore()
  const rtdb = useDatabase()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)
  const [partner, setPartner] = useState<UserProfile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const presence = useUserPresence(partner?.uid)
  
  const partnerId = chat.participants.find(id => id !== currentUserUid)

  useEffect(() => {
    if (!partnerId) return
    getDoc(doc(db, "users", partnerId)).then(snap => {
      if (snap.exists()) setPartner({ uid: snap.id, ...snap.data() } as UserProfile)
    })
    const unreadRef = ref(rtdb, `unreads/${currentUserUid}/${chat.id}`)
    const unsubscribe = onValue(unreadRef, (snapshot) => {
      setUnreadCount(snapshot.val() || 0)
    })
    return () => unsubscribe()
  }, [db, rtdb, partnerId, currentUserUid, chat.id])

  const handleTouchStart = () => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onDelete(chat)
    }, 400)
  }

  const handleTouchEnd = () => { if (timerRef.current) clearTimeout(timerRef.current) }
  const handleClick = () => { if (isLongPress.current) return; router.push(`/chats?startWith=${partnerId}`) }

  if (!partner || blocking.includes(partner.uid) || blockedBy.includes(partner.uid)) return null
  const lastAt = chat.lastMessageAt?.toDate?.() || new Date(chat.lastMessageAt || Date.now())

  return (
    <div 
      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98] border-b border-gray-50 select-none"
      onClick={handleClick}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        <Avatar className="w-14 h-14 rounded-full border-none shadow-sm">
          <AvatarImage src={partner.photoURL} className="object-cover" />
          <AvatarFallback className="bg-[#00A2FF] text-white font-semibold text-sm">{partner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        {presence?.state === 'online' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1 max-w-[70%]">
            <h4 className="font-semibold text-sm text-black truncate">{partner.name}</h4>
            {partner.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#00A2FF] fill-white shrink-0" />}
            {partner.isAdmin && <Circle className="w-2 h-2 fill-[#00A2FF] text-[#00A2FF] shrink-0" />}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{format(lastAt, "HH:mm")}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className={cn("text-xs truncate flex-1 pr-2", unreadCount > 0 ? "text-black font-semibold" : "text-gray-500 font-medium")}>
            {chat.lastMessage || "Start talking..."}
          </p>
          {unreadCount > 0 && <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount}</div>}
        </div>
      </div>
    </div>
  )
}

function GiftDrawer({ onSend, userBalance, open, onOpenChange }: { onSend: (gift: typeof GIFTS[0]) => void, userBalance: number, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [selectedGiftId, setSelectedGiftId] = useState(GIFTS[0].id)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none bg-[#1A1C21] text-white rounded-t-[2.5rem] max-w-md mx-auto fixed bottom-0 top-auto translate-y-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-6 px-4 overflow-x-auto no-scrollbar py-2 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest text-white border-b-2 border-[#D4FF00] pb-1">Gifts</span>
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto no-scrollbar px-2">
            {GIFTS.map(gift => (
              <div 
                key={gift.id}
                onClick={() => setSelectedGiftId(gift.id)}
                className={cn("flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all cursor-pointer aspect-square", selectedGiftId === gift.id ? "border-[#D4FF00] bg-white/5" : "border-transparent")}
              >
                <span className="text-3xl mb-1">{gift.icon}</span>
                <div className="flex items-center gap-0.5 mt-1">
                  <Coins className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                  <span className="text-[10px] font-bold">{gift.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 pb-6 px-4">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <Coins className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-lg font-bold">{userBalance}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
            <Button onClick={() => onSend(GIFTS.find(g => g.id === selectedGiftId)!)} className="bg-[#D4FF00] text-black font-bold h-12 px-8 rounded-full">Send</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const startWithId = searchParams.get("startWith")
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const rtdb = useDatabase()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isInitializingChat, setIsInitializingChat] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null)
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [userBalances, setUserBalances] = useState({ coins: 0, diamonds: 0 })
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video' } | null>(null)

  const currentUserRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserRef)

  useEffect(() => {
    if (!currentUser?.uid) return
    const fetchBalance = async () => {
      const snap = await get(ref(rtdb, `balances/${currentUser.uid}`))
      if (snap.exists()) {
        const data = snap.val()
        setUserBalances({ coins: data.coins || 0, diamonds: data.diamonds || 0 })
      }
    }
    fetchBalance()
  }, [rtdb, currentUser?.uid])

  useEffect(() => {
    if (!chatId) return
    const callRef = ref(rtdb, `calls/${chatId}`)
    return onValue(callRef, (snap) => {
      const data = snap.val()
      if (data && data.status === 'initiating' && data.callerId !== currentUser?.uid) {
        setActiveCall({ type: data.type })
      }
    })
  }, [chatId, currentUser?.uid, rtdb])

  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(
      collection(db, "chats"), 
      where("participants", "array-contains", currentUser.uid), 
      orderBy("lastMessageAt", "desc"), 
      limit(20)
    )
  }, [db, currentUser?.uid])

  const { data: userChatsRaw, loading: listLoading } = useCollection<Chat>(chatListQuery)
  const userChats = useMemo(() => {
    if (!currentUser?.uid || !currentUserProfile) return []
    const blocking = currentUserProfile.blocking || []
    const blockedBy = currentUserProfile.blockedBy || []
    return [...userChatsRaw].filter(chat => {
      if (!chat.lastMessage) return false
      const partnerId = chat.participants.find(p => p !== currentUser.uid)
      if (partnerId && (blocking.includes(partnerId) || blockedBy.includes(partnerId))) return false
      return true
    })
  }, [userChatsRaw, currentUser?.uid, currentUserProfile])

  const partnerRef = useMemoFirebase(() => startWithId ? doc(db, "users", startWithId) : null, [db, startWithId])
  const { data: chatPartner } = useDoc<UserProfile>(partnerRef)
  const partnerPresence = useUserPresence(chatPartner?.uid)

  useEffect(() => {
    if (chatId && currentUser?.uid) {
      set(ref(rtdb, `unreads/${currentUser.uid}/${chatId}`), 0)
    }
  }, [chatId, currentUser?.uid, rtdb])

  useEffect(() => {
    if (!currentUser?.uid || !startWithId) return
    setIsInitializingChat(true)
    const findOrCreateChat = async () => {
      try {
        const chatsRef = collection(db, "chats")
        const chatsSnap = await getDocs(query(chatsRef, where("participants", "array-contains", currentUser.uid)))
        let existingChatId = null
        chatsSnap.forEach((doc) => {
          if (doc.data().participants?.includes(startWithId)) existingChatId = doc.id
        })
        if (existingChatId) setChatId(existingChatId)
        else {
          const newChatDoc = await addDoc(chatsRef, {
            participants: [currentUser.uid, startWithId],
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastMessageAt: serverTimestamp(),
            maleMessageCount: 0
          })
          setChatId(newChatDoc.id)
        }
      } finally {
        setIsInitializingChat(false)
      }
    }
    findOrCreateChat()
  }, [currentUser?.uid, startWithId, db])

  useEffect(() => {
    if (!chatId) return
    const messagesRef = rtdbQuery(ref(rtdb, `chat_messages/${chatId}`), limitToLast(50))
    return onValue(messagesRef, (snapshot) => {
      const msgs = snapshot.val() ? Object.entries(snapshot.val()).map(([id, val]: [string, any]) => ({ id, ...val })).sort((a, b) => b.timestamp - a.timestamp) : []
      setMessages(msgs)
    })
  }, [chatId, rtdb])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid) return
    
    if (currentUserProfile?.gender === 'male' && !currentUserProfile.isAdmin) {
      const messageCost = 5
      if (userBalances.coins < messageCost) {
        toast({ variant: "destructive", title: "Insufficient Coins", description: "Recharge to continue chatting." })
        return
      }
      
      setUserBalances(prev => ({ ...prev, coins: prev.coins - messageCost }))
      
      await update(ref(rtdb, `balances/${currentUser.uid}`), {
        coins: rtdbIncrement(-messageCost),
        updatedAt: Date.now()
      })
    }

    const partnerId = chatPartner?.uid
    const timestamp = Date.now()
    try {
      await set(push(ref(rtdb, `chat_messages/${chatId}`)), { text: text.trim(), senderId: currentUser.uid, timestamp })
      if (partnerId) update(ref(rtdb), { [`unreads/${partnerId}/${chatId}`]: rtdbIncrement(1) })
      await updateDoc(doc(db, "chats", chatId), { lastMessage: text.trim(), lastMessageAt: serverTimestamp() })
      setNewMessage("")
    } catch (err: any) { 
      toast({ variant: "destructive", title: "Error", description: err.message }) 
    }
  }

  const handleSendGift = async (gift: typeof GIFTS[0]) => {
    if (!currentUser?.uid || !chatPartner || !chatId) return
    if (userBalances.coins < gift.price) { toast({ variant: "destructive", title: "Insufficient Coins" }); return }
    const timestamp = Date.now()
    try {
      await update(ref(rtdb, `balances/${currentUser.uid}`), { coins: rtdbIncrement(-gift.price), updatedAt: timestamp })
      
      setUserBalances(prev => ({ ...prev, coins: prev.coins - gift.price }))

      const reward = Math.floor(gift.price * 0.5)
      await update(ref(rtdb, `balances/${chatPartner.uid}`), { diamonds: rtdbIncrement(reward), updatedAt: timestamp })
      await set(push(ref(rtdb, `diamond_history/${chatPartner.uid}`)), { amount: reward, type: 'gift', description: `Gift from ${currentUserProfile?.name}`, timestamp })
      
      const text = `Sent a gift: ${gift.icon} ${gift.name}`
      await push(ref(rtdb, `chat_messages/${chatId}`), { text, senderId: currentUser.uid, timestamp, isGift: true })
      await updateDoc(doc(db, "chats", chatId), { lastMessage: text, lastMessageAt: serverTimestamp() })
      setIsGiftDrawerOpen(false)
    } catch (err: any) { toast({ variant: "destructive", title: "Gift Error" }) }
  }

  if (!currentUser) return null
  if (!startWithId) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-[100dvh] pb-20">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 pt-8 pb-3 flex items-center justify-between border-b">
          <h1 className="text-2xl font-bold text-[#00A2FF] tracking-tight">Chat</h1>
        </header>
        <main className="flex-1">
          {userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 px-12 opacity-40"><ShoppingBag className="w-16 h-16 mb-4" /><p className="font-semibold text-xl text-black">No chats yet...</p></div>
          ) : userChats.map(chat => <ChatListItem key={chat.id} chat={chat} currentUserUid={currentUser.uid} blocking={currentUserProfile?.blocking || []} blockedBy={currentUserProfile?.blockedBy || []} onDelete={setChatToDelete} />)}
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden relative">
      <header className="shrink-0 h-14 bg-white/80 backdrop-blur-xl px-4 flex items-center justify-between border-b shadow-sm z-50 sticky top-0">
        <Button variant="ghost" size="sm" onClick={() => router.push("/chats")} className="text-[#00A2FF]"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex flex-col items-center flex-1 mx-2">
          <h3 className="font-semibold text-sm text-black truncate max-w-[120px]">{chatPartner?.name || '...'}</h3>
          {partnerPresence?.state === 'online' && <span className="text-[9px] font-bold text-green-500 uppercase">Online</span>}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setActiveCall({ type: 'voice' })} className="text-gray-400">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveCall({ type: 'video' })} className="text-gray-400">
            <Video className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8 cursor-pointer ml-1" onClick={() => router.push(`/users/${chatPartner?.uid}`)}>
            <AvatarImage src={chatPartner?.photoURL} />
            <AvatarFallback>{chatPartner?.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col-reverse p-4">
        <div className="flex flex-col-reverse space-y-4 space-y-reverse">
          <div ref={messagesEndRef} />
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.uid ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn("max-w-[75%] p-3.5 text-xs font-medium rounded-[1.2rem]", msg.senderId === currentUser.uid ? 'bg-[#00A2FF] text-white rounded-br-none' : 'bg-gray-100 text-black rounded-bl-none')}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setIsGiftDrawerOpen(true)} className="text-[#00A2FF]"><GiftIcon className="w-6 h-6" /></Button>
        <div className="flex-1 bg-gray-100 rounded-full h-11 px-5 flex items-center">
          <input placeholder="Type..." className="bg-transparent flex-1 outline-none text-sm" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)} />
        </div>
        <Button variant="ghost" onClick={() => handleSendMessage(newMessage)}><Send className="w-6 h-6 text-[#00A2FF]" /></Button>
      </footer>

      <GiftDrawer open={isGiftDrawerOpen} onOpenChange={setIsGiftDrawerOpen} userBalance={userBalances.coins} onSend={handleSendGift} />
      
      {activeCall && chatPartner && chatId && (
        <CallInterface 
          chatId={chatId} 
          currentUser={currentUser} 
          partner={chatPartner} 
          callType={activeCall.type} 
          onClose={() => setActiveCall(null)} 
        />
      )}
    </div>
  )
}

export default function ChatsPage() { return <Suspense fallback={null}><ChatsContent /></Suspense> }

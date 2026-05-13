
"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, orderBy, limit, updateDoc, increment } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { 
  Send, 
  ChevronLeft, 
  ShoppingBag, 
  User as UserIcon, 
  Loader2, 
  Mic, 
  Smile, 
  ImageIcon, 
  Phone, 
  Gift, 
  Video, 
  Hash,
  Gamepad2,
  MoreVertical
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: any
}

interface Chat {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: any
  createdAt: any
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country?: string
  gender?: string
  dob?: string
  interests?: string
  coins?: number
}

function MatchInfoCard({ profile }: { profile: UserProfile }) {
  const calculateAge = (dob?: string) => {
    if (!dob) return 21
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--
    return age
  }

  return (
    <div className="mx-4 my-6 bg-[#E1F5FE] rounded-[2rem] p-6 border border-white/40 shadow-sm relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/40 shadow-sm flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <span className="text-[10px] font-black text-gray-500">1.00°C</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-pink-400 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
          ♀ {calculateAge(profile.dob)}
        </span>
        <span className="bg-orange-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
          {profile.country || "Kenya"}
        </span>
        <span className="bg-orange-300 text-white px-3 py-1 rounded-full text-[10px] font-black">
          Personality match!
        </span>
      </div>

      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 mb-5 border border-yellow-200">
        <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
          <CheckCircleIcon className="w-3 h-3 text-white" />
        </div>
        Real Person
      </div>

      <div className="flex gap-2 mb-6">
        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm">
          <img src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}1/200/200`} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm opacity-60">
          <img src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}2/200/200`} className="w-full h-full object-cover" alt="" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
           <EmojiPeepIcon className="w-6 h-6" />
           <p className="text-sm font-black text-[#66BB6A]">Personality similarity: 84%</p>
        </div>
        <p className="text-xs font-bold text-gray-500 leading-relaxed">
          Matches your interests!
        </p>
      </div>
    </div>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function EmojiPeepIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      <div className="w-5 h-5 rounded-full bg-yellow-400 border border-white" />
      <div className="w-5 h-5 rounded-full bg-green-500 border border-white" />
    </div>
  )
}

function ChatListItem({ chat, currentUserUid }: { chat: Chat, currentUserUid: string }) {
  const router = useRouter()
  const db = useFirestore()
  const partnerId = chat.participants.find(id => id !== currentUserUid)
  
  const partnerRef = useMemoFirebase(() => partnerId ? doc(db, "users", partnerId) : null, [db, partnerId])
  const { data: partner } = useDoc<UserProfile>(partnerRef)

  if (!partner) return null

  return (
    <div 
      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98] border-b border-gray-50"
      onClick={() => router.push(`/chats?startWith=${partnerId}`)}
    >
      <Avatar className="w-14 h-14 rounded-full border-none shadow-sm">
        <AvatarImage src={partner.photoURL || `https://picsum.photos/seed/${partner.uid}/200/200`} className="object-cover" />
        <AvatarFallback className="bg-[#FF3B30] text-white font-black text-sm">{partner.name?.[0] || '?'}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="font-black text-sm text-black truncate">{partner.name}</h4>
          <span className="text-[10px] text-gray-400 font-bold">
            {chat.lastMessageAt && chat.lastMessageAt.toDate ? format(chat.lastMessageAt.toDate(), "HH:mm") : "Just now"}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate font-bold">
          {chat.lastMessage || "Start talking..."}
        </p>
      </div>
    </div>
  )
}

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const startWithId = searchParams.get("startWith")
  const { user: currentUser } = useUser()
  const db = useFirestore()

  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isInitializingChat, setIsInitializingChat] = useState(false)

  const currentUserRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserRef)

  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid))
  }, [db, currentUser?.uid])

  const { data: userChatsRaw, loading: listLoading } = useCollection<Chat>(chatListQuery)

  const userChats = useMemo(() => {
    return [...userChatsRaw].sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis?.() || 0
      const timeB = b.lastMessageAt?.toMillis?.() || 0
      return timeB - timeA
    })
  }, [userChatsRaw])

  const partnerRef = useMemoFirebase(() => startWithId ? doc(db, "users", startWithId) : null, [db, startWithId])
  const { data: chatPartner, loading: partnerLoading } = useDoc<UserProfile>(partnerRef)

  useEffect(() => {
    if (!currentUser?.uid || !startWithId) {
      setChatId(null)
      return
    }

    let isMounted = true
    const findOrCreateChat = async () => {
      setIsInitializingChat(true)
      try {
        const chatsRef = collection(db, "chats")
        const chatsSnap = await getDocs(query(chatsRef, where("participants", "array-contains", currentUser.uid)))
        let existingChatId = null
        
        chatsSnap.forEach((doc) => {
          const data = doc.data()
          if (data.participants?.includes(startWithId)) existingChatId = doc.id
        })

        if (!isMounted) return
        if (existingChatId) {
          setChatId(existingChatId)
        } else {
          const chatData = {
            participants: [currentUser.uid, startWithId],
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastMessageAt: serverTimestamp(),
          }
          const newChatDoc = await addDoc(chatsRef, chatData)
          if (isMounted) setChatId(newChatDoc.id)
        }
      } catch (err) {
        if (!isMounted) return
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'chats', operation: 'list' }))
      } finally {
        if (isMounted) setIsInitializingChat(false)
      }
    }
    findOrCreateChat()
    return () => { isMounted = false }
  }, [currentUser?.uid, startWithId, db])

  const messagesQuery = useMemoFirebase(() => {
    if (!chatId) return null
    return query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"), limit(100))
  }, [db, chatId])

  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery)

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid || !currentUserProfile) return
    
    // Coin deduction logic for male users
    if (currentUserProfile.gender === 'male') {
      const currentCoins = currentUserProfile.coins || 0
      if (currentCoins < 15) {
        toast({
          variant: "destructive",
          title: "Insufficient Coins",
          description: "Sending a message costs 15 coins. Visit the Task Center to earn more!",
        })
        return
      }
      
      const userRef = doc(db, "users", currentUser.uid)
      updateDoc(userRef, {
        coins: increment(-15)
      }).catch(() => {
         errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update' }))
      })
    }

    const msgData = { text: text.trim(), senderId: currentUser.uid, timestamp: serverTimestamp() }
    addDoc(collection(db, "chats", chatId, "messages"), msgData)
    updateDoc(doc(db, "chats", chatId), { lastMessage: text.trim(), lastMessageAt: serverTimestamp() })
    setNewMessage("")
  }

  if (!currentUser) return null

  if (!startWithId) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-screen pb-20">
        <header className="sticky top-0 z-40 bg-[#FF3B30] px-4 pt-10 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-logo text-white drop-shadow-sm">MatchFlow</h1>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white hover:bg-white/20">
                <ShoppingBag className="w-6 h-6" />
             </Button>
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white hover:bg-white/20" onClick={() => router.push('/me')}>
                <UserIcon className="w-6 h-6" />
             </Button>
          </div>
        </header>

        <main className="flex-1">
          {listLoading && userChats.length === 0 ? (
             <div className="p-4 space-y-4">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="flex gap-4 items-center">
                   <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                     <div className="h-3 w-1/2 bg-muted animate-pulse rounded opacity-50" />
                   </div>
                 </div>
               ))}
             </div>
          ) : userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-32 px-12 space-y-4 opacity-40">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="font-black text-xl">No chats yet...</p>
            </div>
          ) : (
            <div className="bg-white">
              {userChats.map(chat => (
                <ChatListItem key={chat.id} chat={chat} currentUserUid={currentUser.uid} />
              ))}
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      <header className="bg-white px-4 h-16 flex items-center justify-between shadow-sm z-50 pt-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => router.push("/chats")} className="rounded-full text-gray-500 font-bold px-2">
            <ChevronLeft className="w-6 h-6 mr-0.5" />
            <span className="text-xs">99+</span>
          </Button>
        </div>
        
        <h3 className="font-black text-sm tracking-tight text-center flex-1">
          {chatPartner?.name || 'MatchFlow User'}
        </h3>

        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-full">
            <AvatarImage src={chatPartner?.photoURL} />
            <AvatarFallback className="font-black text-[10px]">{chatPartner?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <ScrollArea className="flex-1 bg-white">
        <div className="pb-32 pt-4">
          {chatPartner && <MatchInfoCard profile={chatPartner} />}

          <div className="text-center my-6">
            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">
              {format(new Date(), "HH:mm")}
            </span>
          </div>

          <div className="px-4 space-y-6">
            {(isInitializingChat || (messagesLoading && messages.length === 0)) ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-[#FF3B30] animate-spin opacity-20" />
              </div>
            ) : messages.map((msg) => (
              <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start')}>
                {msg.senderId !== currentUser.uid && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={chatPartner?.photoURL} />
                    <AvatarFallback className="text-[8px]">{chatPartner?.name?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[75%] p-3 text-xs font-bold relative shadow-sm",
                  msg.senderId === currentUser.uid 
                    ? 'bg-[#FF3B30] text-white rounded-[1.2rem] rounded-br-none' 
                    : 'bg-gray-50 text-black rounded-[1.2rem] rounded-bl-none border border-gray-100'
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t z-50 pt-2 pb-safe">
        <div className="absolute -top-16 right-4">
          <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-blue-100 flex flex-col items-center gap-0.5 active:scale-95 transition-transform cursor-pointer">
            <Gamepad2 className="w-6 h-6 text-blue-500" />
            <span className="text-[8px] font-black uppercase text-yellow-600">Game</span>
          </div>
        </div>

        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar items-center">
          <Button variant="outline" className="h-9 px-4 rounded-full border-green-500 text-green-600 font-black text-xs shrink-0 hover:bg-green-50">
            Can we talk?
          </Button>
          <Button variant="outline" className="h-9 px-4 rounded-full border-green-500 text-green-600 font-black text-xs shrink-0 hover:bg-green-50">
            hey dear are you single?
          </Button>
        </div>

        <div className="px-4 py-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-gray-400">
            <Mic className="w-6 h-6" />
          </Button>
          <div className="flex-1 bg-gray-100 rounded-full h-11 px-4 flex items-center">
            <input 
              placeholder="Start chatting..." 
              className="bg-transparent border-none flex-1 outline-none text-sm font-bold placeholder:text-gray-400" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
            />
          </div>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-yellow-500">
            <Smile className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("w-10 h-10 rounded-full transition-all", newMessage.trim() ? "text-[#FF3B30]" : "text-gray-300")}
            onClick={() => handleSendMessage(newMessage)}
          >
            <Send className="w-6 h-6" />
          </Button>
        </div>

        <div className="px-6 py-2 flex items-center justify-between text-gray-400">
          <ImageIcon className="w-6 h-6" />
          <Phone className="w-6 h-6" />
          <div className="bg-[#FFF8E1] p-2.5 rounded-full shadow-inner">
            <Gift className="w-6 h-6 text-yellow-500" />
          </div>
          <Video className="w-6 h-6" />
          <Hash className="w-6 h-6" />
        </div>
      </footer>
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={null}>
      <ChatsContent />
    </Suspense>
  )
}

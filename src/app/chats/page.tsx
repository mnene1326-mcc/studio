
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
  Gamepad2
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
  const { data: chatPartner } = useDoc<UserProfile>(partnerRef)

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
    
    if (currentUserProfile.gender === 'male') {
      const currentCoins = currentUserProfile.coins || 0
      if (currentCoins < 15) {
        toast({
          variant: "destructive",
          title: "Insufficient Coins",
          description: "Sending a message costs 15 coins.",
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
    <div className="flex-1 flex flex-col h-screen bg-white relative overflow-hidden">
      {/* Architectural Red Header */}
      <header className="bg-[#FF3B30] px-4 pt-12 pb-4 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/chats")} 
            className="rounded-full text-white font-black px-2 hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6 mr-0.5" />
            <span className="text-xs">99+</span>
          </Button>
        </div>
        
        <h3 className="font-black text-sm tracking-tight text-center flex-1 text-white">
          {chatPartner?.name || 'MatchFlow User'}
        </h3>

        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-full border border-white/20">
            <AvatarImage src={chatPartner?.photoURL} />
            <AvatarFallback className="font-black text-[10px]">{chatPartner?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="pb-48 pt-4">
          <div className="text-center my-6">
            <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full tracking-widest">
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
                  "max-w-[75%] p-3.5 text-xs font-bold shadow-sm",
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

      {/* Floating Game Button */}
      <div className="fixed bottom-40 right-4 z-50">
        <div className="bg-white p-2.5 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center gap-0.5 active:scale-95 transition-transform cursor-pointer">
          <Gamepad2 className="w-7 h-7 text-blue-500" />
          <span className="text-[8px] font-black uppercase text-gray-500">GAME</span>
        </div>
      </div>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t z-50 pb-safe">
        {/* Quick Suggestion Chips */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar items-center border-b border-gray-50">
          <button className="h-9 px-5 rounded-full border-2 border-[#66BB6A] text-[#2E7D32] font-black text-xs shrink-0 active:scale-95 transition-all">
            Can we talk?
          </button>
          <button className="h-9 px-5 rounded-full border-2 border-[#66BB6A] text-[#2E7D32] font-black text-xs shrink-0 active:scale-95 transition-all">
            hey dear are you single?
          </button>
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-gray-400">
            <Mic className="w-6 h-6" />
          </Button>
          <div className="flex-1 bg-gray-100 rounded-full h-11 px-5 flex items-center">
            <input 
              placeholder="Start chatting..." 
              className="bg-transparent border-none flex-1 outline-none text-sm font-bold placeholder:text-gray-400 text-black" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
            />
          </div>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#FBC02D]">
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

        {/* Bottom Toolbar Icons */}
        <div className="px-8 py-3 flex items-center justify-between text-gray-400">
          <ImageIcon className="w-7 h-7" />
          <Phone className="w-7 h-7" />
          <div className="relative -mt-4 bg-[#FFD600] p-4 rounded-full shadow-lg border-4 border-white active:scale-90 transition-transform cursor-pointer">
            <Gift className="w-7 h-7 text-white fill-current" />
          </div>
          <Video className="w-7 h-7" />
          <Hash className="w-7 h-7" />
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

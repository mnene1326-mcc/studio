
"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, orderBy, limit, updateDoc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, ChevronLeft, ShoppingBag, User as UserIcon, Gamepad2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
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
  unreadCount?: number
}

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  interests?: string
  lookingFor?: string
}

function ChatListItem({ chat, currentUserUid }: { chat: Chat, currentUserUid: string }) {
  const router = useRouter()
  const db = useFirestore()
  const partnerId = chat.participants.find(id => id !== currentUserUid)
  
  const partnerRef = useMemoFirebase(() => partnerId ? doc(db, "users", partnerId) : null, [db, partnerId])
  const { data: partner } = useDoc<UserProfile>(partnerRef)

  const getStatus = (uid: string) => {
    const statuses = ["🔥 0.2°C", "💧 9.5°C", "🌸 116.4°C"]
    const index = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % statuses.length
    return statuses[index]
  }

  if (!partner) return null

  const randomStatus = getStatus(partner.uid)

  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-all active:scale-[0.98]"
      onClick={() => router.push(`/chats?startWith=${partnerId}`)}
    >
      <div className="relative">
        <Avatar className="w-12 h-12 border border-white shadow-sm">
          <AvatarImage src={partner.photoURL || `https://picsum.photos/seed/${partner.uid}/200/200`} />
          <AvatarFallback className="bg-[#FF3B30] text-white font-black text-xs">{partner.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1 overflow-hidden">
            <h4 className="font-black text-sm text-black truncate">{partner.name}</h4>
            <span className="text-[8px] text-gray-400 font-bold shrink-0">{randomStatus}</span>
          </div>
          <span className="text-[9px] text-gray-400 font-bold">
            {chat.lastMessageAt && chat.lastMessageAt.toDate ? format(chat.lastMessageAt.toDate(), "MM-dd HH:mm") : "Just now"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 truncate font-bold flex-1 pr-4">
            {chat.lastMessage || "hi love..."}
          </p>
          <div className="bg-[#FF3B30] rounded-full w-4 h-4 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-[8px] text-white font-black">1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DraggableGameButton() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Start position: bottom right area
    setPos({ x: window.innerWidth - 70, y: window.innerHeight - 180 })
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    // Boundary checks (stay within screen)
    const margin = 20
    const safeX = Math.max(margin, Math.min(newX, window.innerWidth - 60))
    const safeY = Math.max(margin, Math.min(newY, window.innerHeight - 100))
    
    setPos({ x: safeX, y: safeY })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div 
      className="fixed z-50 touch-none"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="relative group cursor-pointer active:scale-95 transition-transform">
        <div className="bg-[#FF3B30] p-3 rounded-full shadow-lg flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -bottom-1 -left-1 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded-md border border-white shadow-sm pointer-events-none">
          Game
        </div>
      </div>
    </div>
  )
}

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const startWithId = searchParams.get("startWith")
  
  const { user: currentUser } = useUser()
  const db = useFirestore()

  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isInitializingChat, setIsInitializingChat] = useState(false)

  const chatListQuery = useMemoFirebase(() => {
    if (!currentUser?.uid) return null
    return query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    )
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
    return query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"), limit(50))
  }, [db, chatId])

  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery)

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !chatId || !currentUser?.uid) return
    const msgData = { text: text.trim(), senderId: currentUser.uid, timestamp: serverTimestamp() }
    addDoc(collection(db, "chats", chatId, "messages"), msgData)
    updateDoc(doc(db, "chats", chatId), { lastMessage: text.trim(), lastMessageAt: serverTimestamp() })
    setNewMessage("")
  }

  if (!currentUser) return null

  if (!startWithId) {
    return (
      <div className="flex-1 flex flex-col bg-white min-h-screen pb-20">
        <header className="sticky top-0 z-40 bg-[#FF3B30] px-4 pt-8 pb-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-logo text-white drop-shadow-sm">Chat</h1>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white hover:bg-white/20">
                <ShoppingBag className="w-6 h-6" />
             </Button>
             <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white hover:bg-white/20">
                <UserIcon className="w-6 h-6" />
             </Button>
          </div>
        </header>

        <main className="flex-1 divide-y divide-gray-50">
          {listLoading ? (
             <div className="p-4 space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex gap-3 items-center">
                   <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                     <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                   </div>
                 </div>
               ))}
             </div>
          ) : userChats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-8 space-y-4 opacity-40 italic">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
              <p className="font-black text-lg">No active chats...</p>
              <Button onClick={() => router.push("/home")} variant="outline" className="rounded-full h-9 text-xs border-[#FF3B30] text-[#FF3B30] font-black">Find Someone</Button>
            </div>
          ) : (
            <div className="bg-white">
              {userChats.map(chat => (
                <ChatListItem key={chat.id} chat={chat} currentUserUid={currentUser.uid} />
              ))}
            </div>
          )}
        </main>

        <DraggableGameButton />

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      <header className="bg-white border-b p-3 flex items-center gap-2 shadow-sm pt-8">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chats")} className="rounded-full w-8 h-8">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Avatar className="w-10 h-10 border border-[#FF3B30]">
          <AvatarImage src={chatPartner?.photoURL} />
          <AvatarFallback className="font-black text-xs">{chatPartner?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {partnerLoading ? (
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <h3 className="font-black text-base leading-tight">{chatPartner?.name || 'Loading...'}</h3>
              <p className="text-[8px] text-green-500 font-bold">● Online</p>
            </>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 p-3 bg-white/50">
        <div className="space-y-3 pb-4">
          {isInitializingChat || (messagesLoading && messages.length === 0) ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-[#FF3B30] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 opacity-30 italic font-black text-xs">
              Start the conversation...
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-[1.5rem] text-xs font-black shadow-sm",
                  msg.senderId === currentUser.uid 
                    ? 'bg-[#FF3B30] text-white rounded-br-none' 
                    : 'bg-white text-black border border-gray-100 rounded-bl-none'
                )}>
                  {msg.text}
                  <div className="text-[8px] mt-1 opacity-60 text-right italic font-bold">
                    {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), "HH:mm") : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="p-3 bg-white border-t flex items-center gap-2">
        <Input 
          placeholder="Say something nice..." 
          className="rounded-full bg-gray-50 border-none h-10 font-black text-xs px-4" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
        />
        <Button 
          size="icon" 
          className="rounded-full w-10 h-10 bg-[#FF3B30] hover:bg-red-600 text-white shrink-0" 
          disabled={!newMessage.trim() || !chatId}
          onClick={() => handleSendMessage(newMessage)}
        >
          <Send className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center font-black text-xl text-[#FF3B30] animate-pulse">MatchFlow...</div>}>
      <ChatsContent />
    </Suspense>
  )
}

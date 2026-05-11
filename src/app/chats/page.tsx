"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { BottomNav } from "@/components/layout/BottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Sparkles, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { suggestChatStarter } from "@/ai/flows/suggest-chat-starter"
import { format } from "date-fns"

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: any
}

interface ChatPartner {
  uid: string
  name: string
  photoURL: string
  interests?: string
  lookingFor?: string
}

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const startWithId = searchParams.get("startWith")
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showAi, setShowAi] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login")
        return
      }
      
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        setCurrentUser({ uid: user.uid, ...userDoc.data() })
      }

      if (startWithId) {
        const partnerDoc = await getDoc(doc(db, "users", startWithId))
        if (partnerDoc.exists()) {
          setChatPartner({ uid: startWithId, ...partnerDoc.data() } as ChatPartner)
          
          // Find or create chat room
          const chatsQ = query(
            collection(db, "chats"),
            where("participants", "array-contains", user.uid)
          )
          const chatsSnap = await getDocs(chatsQ)
          let existingChatId = null
          chatsSnap.forEach((doc) => {
            const data = doc.data()
            if (data.participants.includes(startWithId)) {
              existingChatId = doc.id
            }
          })

          if (existingChatId) {
            setChatId(existingChatId)
          } else {
            const newChatDoc = await addDoc(collection(db, "chats"), {
              participants: [user.uid, startWithId],
              createdAt: serverTimestamp(),
            })
            setChatId(newChatDoc.id)
          }
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [startWithId, router])

  useEffect(() => {
    if (!chatId) return
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
      setMessages(msgs)
    })
    return () => unsubscribe()
  }, [chatId])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !currentUser) return
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: text.trim(),
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    })
    setNewMessage("")
    setShowAi(false)
  }

  const getAiSuggestions = async () => {
    if (!currentUser || !chatPartner) return
    try {
      const result = await suggestChatStarter({
        currentUserProfile: {
          name: currentUser.name || "User",
          interests: currentUser.interests || "Interested in connection",
          lookingFor: currentUser.lookingFor || "Friendship",
        },
        otherUserProfile: {
          name: chatPartner.name,
          interests: chatPartner.interests || "Matched profile",
          lookingFor: chatPartner.lookingFor || "Meaningful conversations",
        },
      })
      setAiSuggestions(result.suggestions)
      setShowAi(true)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="p-10 text-center animate-pulse">Loading conversation...</div>

  if (!chatPartner) {
    return (
      <div className="flex-1 flex flex-col p-6 bg-background pb-20">
        <header className="mb-6">
          <h1 className="text-3xl font-headline text-primary">Messages</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
          <MessageSquare className="w-16 h-16 text-muted-foreground" />
          <p className="font-body">Start a conversation from the home screen!</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background relative overflow-hidden">
      <header className="bg-white border-b p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/home")} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatPartner.photoURL} />
          <AvatarFallback>{chatPartner.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-headline text-primary leading-tight">{chatPartner.name}</h3>
          <p className="text-[10px] text-muted-foreground">Active now</p>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full bg-accent/20 text-primary border-none hover:bg-accent/40"
          onClick={getAiSuggestions}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          AI Starter
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm font-body shadow-sm ${
                  msg.senderId === currentUser?.uid 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white text-foreground rounded-bl-none'
                }`}
              >
                {msg.text}
                <div className={`text-[8px] mt-1 opacity-70 text-right`}>
                  {msg.timestamp ? format(msg.timestamp.toDate(), "HH:mm") : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {showAi && aiSuggestions.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 border-2 border-accent animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-headline text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Suggested Starters
            </p>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowAi(false)}>Close</Button>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <Button 
                key={i} 
                variant="ghost" 
                className="w-full text-left justify-start h-auto p-2 text-xs bg-muted/50 hover:bg-accent/20 rounded-xl whitespace-normal font-body"
                onClick={() => {
                  setNewMessage(s)
                  setShowAi(false)
                }}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      <footer className="p-4 bg-white border-t flex items-center gap-2">
        <Input 
          placeholder="Type a message..." 
          className="rounded-full border-muted-foreground/20 font-body" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
        />
        <Button 
          size="icon" 
          className="rounded-full shrink-0" 
          disabled={!newMessage.trim()}
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
    <Suspense fallback={<div>Loading chats...</div>}>
      <ChatsContent />
    </Suspense>
  )
}
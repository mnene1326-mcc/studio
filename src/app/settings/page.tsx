"use client"

import { auth, db } from "@/lib/firebase"
import { deleteUser, signOut } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, LogOut, Trash2, ShieldAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteAccount = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const uid = user.uid
      // Delete from firestore first
      await deleteDoc(doc(db, "users", uid))
      // Delete firebase auth user
      await deleteUser(user)
      
      toast({
        title: "Account deleted",
        description: "Your account and data have been removed.",
      })
      router.push("/register")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "For security reasons, please re-authenticate and try again.",
      })
    }
  }

  return (
    <div className="flex-1 bg-background flex flex-col">
      <header className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/me"><ChevronLeft className="w-6 h-6" /></Link>
        </Button>
        <h2 className="text-xl font-headline text-primary flex-1 text-center pr-10">Settings</h2>
      </header>

      <main className="p-6 space-y-8">
        <section className="space-y-4">
          <h3 className="font-headline text-lg text-primary">Account Management</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 gap-3 border-muted-foreground/20 rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start h-12 gap-3 rounded-xl"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-destructive" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive hover:bg-destructive/90 rounded-full"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-headline text-lg text-primary">Privacy & Safety</h3>
          <div className="bg-white p-4 rounded-2xl border space-y-4 text-sm text-muted-foreground font-body">
            <p>MatchFlow is committed to your safety. We never share your private location with others.</p>
            <p>Report any suspicious activity or harassment immediately to our support team.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
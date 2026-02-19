import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import LogoutButton from "@/components/LogoutButton";

export default async function Dashboard() {
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
          <LogoutButton />
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">Add New Bookmark</h2>
          <BookmarkForm />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Your Bookmarks</h2>
          <BookmarkList />
        </div>
      </main>
    </div>
  );
}

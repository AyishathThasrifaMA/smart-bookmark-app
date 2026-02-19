"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/lib/supabaseClient";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

// Create a context to share refresh function
const BookmarkRefreshContext = createContext<{
  refreshBookmarks: () => void;
}>({
  refreshBookmarks: () => {},
});

export const useBookmarkRefresh = () => useContext(BookmarkRefreshContext);

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching bookmarks:", error);
        return;
      }
      
      setBookmarks(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  // Make refresh function available globally
  useEffect(() => {
    // Store refresh function globally for BookmarkForm to use
    (window as any).refreshBookmarks = fetchBookmarks;
    
    return () => {
      delete (window as any).refreshBookmarks;
    };
  }, []);

  useEffect(() => {
    fetchBookmarks();

    const channel = supabase
      .channel("realtime bookmarks")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "bookmarks" 
        },
        (payload: any) => {
          console.log("Realtime event received:", payload.event, payload);
          // Always refetch for any bookmark change
          fetchBookmarks();
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteBookmark = async (id: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error("No user found");
        return;
      }

      console.log("Deleting bookmark:", id);
      
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);
      
      if (error) {
        console.error("Error deleting bookmark:", error);
      } else {
        console.log("Bookmark deleted successfully");
        // Immediately refresh the list
        fetchBookmarks();
      }
    } catch (err) {
      console.error("Error deleting bookmark:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-black mb-1">No bookmarks yet</h3>
        <p className="text-black">Start by adding your first bookmark above!</p>
      </div>
    );
  }

  return (
    <BookmarkRefreshContext.Provider value={{ refreshBookmarks: fetchBookmarks }}>
      <div className="space-y-2">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="group flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-lg font-medium text-black hover:text-blue-600 truncate"
              >
                {bookmark.title}
              </a>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-black hover:text-blue-500 truncate"
              >
                {bookmark.url}
              </a>
              <p className="text-xs text-black mt-1">
                Added {formatDate(bookmark.created_at)}
              </p>
            </div>
            
            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="ml-4 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Delete bookmark"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </BookmarkRefreshContext.Provider>
  );
}

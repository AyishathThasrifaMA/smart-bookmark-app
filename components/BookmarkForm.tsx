"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function BookmarkForm() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!title.trim() || !url.trim()) {
      setError("Both title and URL are required");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("You must be logged in to add bookmarks");
        return;
      }

      const { error } = await supabase.from("bookmarks").insert({
        title: title.trim(),
        url: url.trim(),
        user_id: userData.user.id,
      });

      if (error) {
        console.error("Insert error:", error);
        throw error;
      } else {
        console.log("Bookmark inserted successfully");
        // Immediately refresh the bookmark list
        if ((window as any).refreshBookmarks) {
          (window as any).refreshBookmarks();
        }
      }

      setTitle("");
      setUrl("");
    } catch (err) {
      setError("Failed to add bookmark. Please try again.");
      console.error("Error adding bookmark:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={addBookmark} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter bookmark title"
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-black mb-1">
            URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Adding..." : "Add Bookmark"}
      </button>
    </form>
  );
}

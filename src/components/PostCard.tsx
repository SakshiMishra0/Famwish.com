// src/components/PostCard.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; 
import { NgoPost } from '@/types';
import { Heart, MessageCircle, Send, DollarSign, Share2, User } from 'lucide-react'; 
import ImageCarousel from './ImageCarousel'; 

// New Interface for local comment state
interface PostComment {
    _id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
    profilePicture?: string;
}

interface Props {
  post: NgoPost;
}

const formatTimeAgo = (isoString: string): string => {
    const now = new Date();
    const past = new Date(isoString);
    const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${new Date(isoString).toLocaleDateString()}`;
};


export default function PostCard({ post }: Props) {
  const { data: session } = useSession();
  const userId = (session?.user as { id: string })?.id;
  
  // --- STATE for comments functionality ---
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  // ----------------------------------------
    
  // --- STATE for likes ---
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [loading, setLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount); 
  // -----------------------


  // --- Fetch Comments Handler (unchanged) ---
  const fetchComments = useCallback(async () => {
    if (!showComments || commentsLoading) return;
    
    setCommentsLoading(true);
    try {
        const res = await fetch(`/api/ngo/posts/${post._id}/comments`);
        if (res.ok) {
            const data: PostComment[] = await res.json();
            setComments(data);
        } else {
            console.error("Failed to fetch comments.");
        }
    } catch (e) {
        console.error("Network error fetching comments:", e);
    } finally {
        setCommentsLoading(false);
    }
  }, [post._id, showComments, commentsLoading]);
  
  // Effect to fetch comments when the section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
        fetchComments();
    }
  }, [showComments, comments.length, fetchComments]);


  // --- Post Comment Handler (unchanged) ---
  const postComment = async () => {
    const text = commentInput.trim();
    if (!text) return;
    
    if (!session) {
      alert("You must be logged in to post a comment.");
      return;
    }

    setCommentInput(''); // Clear input optimistically

    // Optimistic UI update
    const newComment: PostComment = {
        _id: Date.now().toString(),
        userId: userId!,
        userName: session.user?.name || 'You',
        text: text,
        createdAt: new Date().toISOString(),
        profilePicture: (session.user as any)?.profilePicture || undefined, 
    };
    setComments(prev => [newComment, ...prev]);
    setCommentsCount(prev => prev + 1);
    
    try {
        const res = await fetch(`/api/ngo/posts/${post._id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to post comment.");
        }

        fetchComments(); 

    } catch (e: any) {
        console.error("Comment post failed:", e);
        alert("Error posting comment. Please try again.");
        setCommentsCount(prev => prev - 1); 
        setComments(prev => prev.filter(c => c._id !== newComment._id));
        setCommentInput(text); 
    }
  };
  // ------------------------------------------


  // --- Like Toggle Handler (unchanged) ---
  const handleLikeToggle = async () => {
    if (!session) {
      alert("Please log in to like a post.");
      return;
    }
    if (loading) return;
    
    setLoading(true);
    const currentStatus = isLiked;
    const currentCount = likesCount;
    const newCount = currentStatus ? likesCount - 1 : likesCount + 1;

    setIsLiked(!currentStatus);
    setLikesCount(newCount);

    try {
      const res = await fetch(`/api/ngo/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error("Failed to toggle like.");
      }
      
      const data = await res.json();
      
      setIsLiked(data.isLiked);
      setLikesCount(data.newLikesCount);

    } catch (e) {
      console.error("Like toggle failed:", e);
      alert("Error: Could not update like status. Please try again.");
      setIsLiked(currentStatus);
      setLikesCount(currentCount); 
    } finally {
        setLoading(false);
    }
  };
  // ---------------------------------------


  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#E8E3DB] mb-6">
      
      {/* Post Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <Link href={`/ngo/${post.ngoId}`} className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white bg-gradient-to-br from-[#2F235A] to-[#463985] overflow-hidden">
            {/* --- FIX: Display NGO Profile Picture or Fallback --- */}
            {post.ngoProfilePicture ? (
                <img
                    src={post.ngoProfilePicture}
                    alt={post.ngoName}
                    className="w-full h-full rounded-full object-cover"
                />
            ) : (
                <DollarSign size={20} />
            )}
            {/* ---------------------------------------------------- */}
        </Link>
        <div>
          <Link href={`/ngo/${post.ngoId}`} className="font-bold text-lg text-[#22163F] hover:underline">
            {post.ngoName}
          </Link>
          <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)} • Impact Post</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {post.title && (
            <h2 className="text-xl font-bold mb-2 text-[#2F235A]">{post.title}</h2>
        )}
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media: Use Carousel */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="w-full">
            <ImageCarousel mediaUrls={post.mediaUrls} />
        </div>
      )}

      {/* Post Footer / Actions */}
      <div className="flex justify-between items-center px-4 py-3 text-sm text-gray-600 border-t border-gray-100">
        <div className="flex gap-4">
            {/* LIKE BUTTON - FUNCTIONAL */}
            <button 
                onClick={handleLikeToggle}
                className={`flex items-center gap-1 transition ${isLiked ? 'text-red-500 font-semibold' : 'hover:text-red-500'} ${loading ? 'opacity-50' : ''}`}
                disabled={loading}
            >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} /> 
                Like ({likesCount})
            </button>
            
            {/* COMMENTS BUTTON - USES LOCAL STATE FOR DISPLAY */}
            <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1 transition ${showComments ? 'text-blue-500 font-semibold' : 'hover:text-blue-500'}`}
            >
                <MessageCircle size={18} /> Comment ({commentsCount})
            </button>
        </div>
        <button 
            onClick={() => alert("Share functionality would open a modal/system share dialog.")}
            className="flex items-center gap-1 hover:text-gray-900 transition"
        >
            <Share2 size={18} /> Share
        </button>
      </div>

      {/* --- COMMENTS SECTION --- */}
      {showComments && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
            {/* Comment Input */}
            <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex-shrink-0">
                    {session?.user && (session.user as any).profilePicture ? (
                        <img
                            src={(session.user as any).profilePicture}
                            alt="Your profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-white">
                            <User size={16} />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <textarea
                        rows={1}
                        placeholder={session ? "Write a comment..." : "Log in to comment..."}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); }
                        }}
                        className="w-full p-2 border rounded-lg resize-none text-sm focus:ring-1 focus:ring-[#2F235A] disabled:bg-white"
                        disabled={!session}
                    />
                    <button
                        onClick={postComment}
                        disabled={!commentInput.trim() || !session}
                        className="mt-1 px-3 py-1 bg-[#2F235A] text-white text-xs font-semibold rounded-lg hover:bg-[#463985] disabled:bg-gray-400"
                    >
                        <Send size={12} className="inline-block mr-1" /> Post
                    </button>
                </div>
            </div>

            {/* Comment List */}
            <h4 className="text-sm font-bold mb-3 text-[#22163F]">{commentsCount} Comments</h4>
            
            {commentsLoading && <p className="text-sm text-gray-500">Loading comments...</p>}
            
            {!commentsLoading && comments.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
            )}

            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {comments.map(comment => (
                    <div key={comment._id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0">
                            {comment.profilePicture ? (
                                <img
                                    src={comment.profilePicture}
                                    alt={comment.userName}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-white">
                                    <User size={16} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <p className="font-semibold text-xs text-[#22163F] inline-block">{comment.userName}</p>
                            <span className="text-xs text-gray-500 ml-2" suppressHydrationWarning>
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                            <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>

        </div>
      )}
      {/* --------------------------------- */}
    </div>
  );
}
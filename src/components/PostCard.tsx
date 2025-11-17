// src/components/PostCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { NgoPost } from '@/types';
import { Heart, MessageCircle, Share2, DollarSign } from 'lucide-react';

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
    return `${Math.floor(diffSeconds / 86400)}d ago`;
};


export default function PostCard({ post }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#E8E3DB] mb-6">
      
      {/* Post Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <Link href={`/ngo/${post.ngoId}`} className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs text-white bg-gradient-to-br from-[#2F235A] to-[#463985]">
            <DollarSign size={20} />
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

      {/* Media */}
      {post.mediaUrl && (
        <div className="w-full h-72 bg-gray-100 flex items-center justify-center border-t border-b overflow-hidden">
            <img src={post.mediaUrl} alt="Post Media" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Post Footer / Actions */}
      <div className="flex justify-between items-center px-4 py-3 text-sm text-gray-600 border-t border-gray-100">
        <div className="flex gap-4">
            <button className="flex items-center gap-1 hover:text-red-500 transition">
                <Heart size={18} /> Like (42)
            </button>
            <button className="flex items-center gap-1 hover:text-blue-500 transition">
                <MessageCircle size={18} /> Comment (8)
            </button>
        </div>
        <button className="flex items-center gap-1 hover:text-gray-900 transition">
            <Share2 size={18} /> Share
        </button>
      </div>
    </div>
  );
}
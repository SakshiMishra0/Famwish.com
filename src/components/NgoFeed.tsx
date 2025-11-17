// src/components/NgoFeed.tsx
"use client";

import { useState, useEffect } from 'react';
import { NgoPost } from '@/types';
import PostCard from './PostCard';

export default function NgoFeed() {
    const [posts, setPosts] = useState<NgoPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch('/api/ngo/posts');
                if (!res.ok) {
                    // This often fails if the database is empty or the API endpoint is not set up yet.
                    throw new Error("Failed to fetch NGO posts (check console for API status).");
                }
                const data = await res.json();
                setPosts(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
        
        // Setup polling for new posts (every 30 seconds)
        const intervalId = setInterval(fetchPosts, 30000); 
        return () => clearInterval(intervalId);

    }, []);

    if (loading) {
        return <div className="text-center py-10 text-gray-500">Loading the NGO Feed...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500 border border-red-300 bg-red-50 rounded-xl">{error}</div>;
    }

    if (posts.length === 0) {
        return <div className="text-center py-10 text-gray-500 border rounded-xl bg-white">No recent posts from our NGO partners.</div>;
    }

    return (
        <div className="space-y-6">
            {posts.map(post => (
                <PostCard key={post._id} post={post} />
            ))}
        </div>
    );
}
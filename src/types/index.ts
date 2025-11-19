// src/types/index.ts
export interface Celeb {
  id: string;
  name: string;
  desc: string;
  followers: number;
}

// Moved from src/lib/generateFans.ts to be project-wide
export interface Fan {
  id: string;
  name: string;
  points: number;
  bids: number;
  wishes: number;
  celebName?: string; // for global leaderboard
}

export interface NgoPost {
  _id: string;
  ngoId: string;
  ngoName: string;
  title: string;
  content: string;
  mediaUrls: string[]; 
  createdAt: string;
  likesCount: number;
  commentsCount: number; 
  isLiked: boolean; 
  // --- NEW FIELD ---
  ngoProfilePicture: string | null;
  // -----------------
}
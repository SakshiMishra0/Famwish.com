// src/types/index.ts
export interface Celeb {
  id: string;
  name: string;
  desc: string;
  followers: number;
}

export interface NgoPost {
  _id: string;
  ngoId: string;
  ngoName: string;
  title: string;
  content: string;
  // --- MODIFIED ---
  mediaUrls: string[]; // Change to array
  // ----------------
  createdAt: string;
}
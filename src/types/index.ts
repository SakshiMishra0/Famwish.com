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
  mediaUrl: string | null;
  createdAt: string;
}
// src/app/ngo/create-post/page.tsx
"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, FileText, ImageIcon, X, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";

// MAX_IMAGES constant
const MAX_IMAGES = 4;

// Helper function to convert File to Base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

// Reusable Input/Textarea component with enhanced styling
const StyledInput: React.FC<any> = ({ label, required, as = 'input', ...rest }) => (
  <div>
    <label className="font-semibold text-sm mb-1 block text-[#22163F]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {as === 'textarea' ? (
      <textarea
        rows={6}
        className="w-full p-4 rounded-xl border border-gray-300 bg-white text-base shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition resize-none"
        {...rest}
      />
    ) : (
      <input
        type="text"
        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-base shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
        {...rest}
      />
    )}
  </div>
);

// Enhanced Media Upload Component for Multiple Images
const MediaUpload: React.FC<{ mediaUrls: string[], onSelect: (files: File[]) => void, onRemove: (url: string) => void }> = ({ mediaUrls, onSelect, onRemove }) => {
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onSelect(files);
        }
        e.target.value = ''; // Reset input to allow re-upload of same file
    };

    const canUpload = mediaUrls.length < MAX_IMAGES;
    
    return (
        <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <ImageIcon size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Add Images ({mediaUrls.length}/{MAX_IMAGES})</h2>
                </div>
                {mediaUrls.length > 0 && (
                    <span className="text-sm text-gray-500">{mediaUrls.length} image{mediaUrls.length !== 1 ? 's' : ''} added.</span>
                )}
            </div>
            
            <div className="flex flex-wrap gap-4">
                
                {/* Previews */}
                {mediaUrls.map((url) => (
                    <div key={url} className="relative h-32 w-32 rounded-xl overflow-hidden shadow-md border-2 border-gray-100 group">
                        <img src={url} alt="Media Preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onRemove(url)}
                            className="absolute top-0 right-0 bg-red-600/80 text-white p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition"
                            aria-label="Remove image"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {/* Upload Button */}
                {canUpload && (
                    <label 
                        htmlFor="media-upload"
                        className="flex flex-col items-center justify-center p-3 rounded-xl border-4 border-dashed border-[#2F235A] bg-[#F4F7FF] text-[#22163F] h-32 w-32 text-xs font-semibold cursor-pointer transition hover:bg-[#E7E1F6]"
                    >
                        <ImageIcon size={30} className="mb-1 text-[#2F235A]" />
                        <span className="text-center">Add Photo</span>
                        <input
                            id="media-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                    </label>
                )}
                {!canUpload && (
                    <div className="flex items-center justify-center p-3 rounded-xl border-4 border-dashed border-gray-300 bg-gray-100 text-gray-500 h-32 w-32 text-xs font-semibold cursor-not-allowed">
                        Max {MAX_IMAGES}
                    </div>
                )}
            </div>
            {mediaUrls.length > 0 && (
                <p className="text-sm text-gray-500 mt-3">All images will be displayed in a carousel on your post.</p>
            )}
        </div>
    );
};


export default function CreateNgoPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // --- 1. ALL HOOKS ARE CALLED FIRST AND UNCONDITIONALLY ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleImageRemove = useCallback((urlToRemove: string) => {
    setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
  }, []);
  // --------------------------------------------------------

  // --- 2. HANDLERS DEFINED BEFORE CONDITIONAL RETURN ---
  const handleImagesSelect = async (files: File[]) => {
    const spaceLeft = MAX_IMAGES - mediaUrls.length;
    const filesToProcess = files.slice(0, spaceLeft);

    if (filesToProcess.length === 0) {
        if (files.length > 0) setError(`Cannot upload more than ${MAX_IMAGES} images.`);
        return;
    }

    try {
        const base64Urls = await Promise.all(filesToProcess.map(fileToBase64));
        setMediaUrls(prev => [...prev, ...base64Urls]);
        setError("");
    } catch (e) {
        setError("Failed to process one or more image files.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
        setError("Post content cannot be empty.");
        return;
    }

    setLoading(true);

    const postData = {
        title: title.trim() || null,
        content: content.trim(),
        mediaUrls: mediaUrls,
    };

    try {
        const res = await fetch("/api/ngo/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to create post.");
        }

        alert("Impact Post created successfully! Redirecting to feed.");
        router.push("/ngos");
    } catch (err: any) {
        setError(err.message);
    }
    setLoading(false);
  };
  // ----------------------------------------------------

  // --- 3. CONDITIONAL LOGIC & HOOK ---
  const isNgo = (session?.user as { role: string })?.role === 'ngo';

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (!isNgo) {
      alert("Access denied. Only authenticated NGO accounts can create posts.");
      router.push("/ngos");
    }
  }, [status, isNgo, router]);
  
  // --- 4. CONDITIONAL RETURN ---
  if (status === "loading" || status === "unauthenticated" || !isNgo) {
    return <div className="text-center py-20">Loading or checking authorization...</div>;
  }
  // -----------------------------


  return (
    <div className="max-w-4xl mx-auto py-10">
      
      <div className="sticky top-0 z-10 bg-[#F6F3EC] py-4 border-b border-gray-200 -mt-10">
        <Link href="/ngos" className="flex items-center gap-2 text-lg font-bold text-[#22163F] hover:text-[#463985] transition">
          <ArrowLeft size={20} /> Back to NGO Feed
        </Link>
        <h1 className="text-4xl font-extrabold mt-2 text-[#22163F]">
          Publish New Impact Post
        </h1>
      </div>


      <div className="card bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-[#E8E3DB] mt-6">
        <p className="text-sm text-[#6B6B6B] mb-8">
            Share an update on your latest charity work, auction impact, or future goals.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
            
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <FileText size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Post Details</h2>
                </div>
                
                <StyledInput 
                    label="Headline (Optional)"
                    placeholder="A short, catchy headline for your update" 
                    value={title}
                    onChange={(e: any) => setTitle(e.target.value)}
                    maxLength={100}
                />

                <StyledInput 
                    label="Main Content"
                    as="textarea"
                    placeholder="Tell your followers about the impact you're making..."
                    value={content}
                    onChange={(e: any) => setContent(e.target.value)}
                    required
                />
            </section>

            <MediaUpload 
                mediaUrls={mediaUrls}
                onSelect={handleImagesSelect} 
                onRemove={handleImageRemove} 
            />

            {error && <p className="text-red-600 text-sm text-center mb-4 p-3 rounded-lg border border-red-300 bg-red-50">{error}</p>}

            <button 
                type="submit" 
                disabled={loading || !content.trim()}
                className={cn(
                    "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-extrabold transition",
                    loading || !content.trim() 
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                        : "bg-[#2F235A] text-white hover:bg-[#463985]"
                )}
            >
                <Send size={20} /> {loading ? "Publishing..." : "Publish Impact Post"}
            </button>
            
        </form>
      </div>
    </div>
  );
}
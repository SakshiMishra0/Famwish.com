// src/app/ngo/create-post/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, FileText, ImageIcon, X } from "lucide-react";
import { cn } from "@/utils/cn";

// Helper function to convert File to Base64 data URL (copied from auction create page)
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

// Enhanced Media Upload Component
const MediaUpload: React.FC<{ mediaUrl: string | null, onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, onRemove: () => void }> = ({ mediaUrl, onSelect, onRemove }) => {
    return (
        <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3 mb-4">
                <ImageIcon size={24} className="text-[#D9A441]" />
                <h2 className="text-xl font-bold text-[#22163F]">Add Image (Optional)</h2>
            </div>
            
            {mediaUrl ? (
                <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg border-4 border-gray-100 transition duration-300 hover:border-[#D9A441]">
                    <img src={mediaUrl} alt="Media Preview" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition"
                        aria-label="Remove image"
                    >
                        <X size={20} />
                    </button>
                </div>
            ) : (
                <label 
                    htmlFor="media-upload"
                    className="flex flex-col items-center justify-center p-12 rounded-xl border-4 border-dashed border-[#2F235A] bg-[#F4F7FF] text-[#22163F] font-semibold cursor-pointer transition hover:bg-[#E7E1F6]"
                >
                    <ImageIcon size={36} className="mb-3 text-[#2F235A]" />
                    <span className="text-lg">Drag image here or Click to upload</span>
                    <span className="text-sm text-gray-500 mt-1">PNG, JPG, Max 1 file</span>
                    <input
                        id="media-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={onSelect}
                    />
                </label>
            )}
        </div>
    );
};


export default function CreateNgoPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isNgo = (session?.user as { role: string })?.role === 'ngo';

  // Auth check and redirection
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (!isNgo) {
      alert("Access denied. Only authenticated NGO accounts can create posts.");
      router.push("/ngos");
    }
  }, [status, isNgo, router]);
  
  if (status === "loading" || status === "unauthenticated" || !isNgo) {
    return <div className="text-center py-20">Loading or checking authorization...</div>;
  }

  // File Upload Handler (simplified for one image)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Url = await fileToBase64(file);
        setMediaUrl(base64Url);
        setError("");
        e.target.value = ''; // Reset input so same file can be selected again
      } catch (e) {
        setError("Failed to process image file.");
      }
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
        mediaUrl: mediaUrl,
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
                mediaUrl={mediaUrl}
                onSelect={handleImageSelect}
                onRemove={() => setMediaUrl(null)}
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
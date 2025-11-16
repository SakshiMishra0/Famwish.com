// src/components/CreateAuctionModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateAuctionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    startingBid: "",
    category: "Art", // Default category
    description: "",
    endDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Success!
      alert("Auction created successfully!");
      onClose(); // Close the modal
      router.refresh(); // Refresh the page to show the new auction
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative animate-slideUp">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-black">
          <X />
        </button>

        <h2 className="text-xl font-bold text-center mb-4 text-[#22163F]">
          Create a New Auction
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              name="title"
              placeholder="E.g., Signed Guitar, 30-min Zoom call"
              className="mt-1 w-full px-4 py-2 rounded-md border"
              onChange={handleChange}
              value={formData.title}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Starting Bid (₹) *</label>
              <input
                name="startingBid"
                type="number"
                placeholder="E.g., 5000"
                className="mt-1 w-full px-4 py-2 rounded-md border"
                onChange={handleChange}
                value={formData.startingBid}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                name="category"
                className="mt-1 w-full px-4 py-2 rounded-md border bg-white"
                onChange={handleChange}
                value={formData.category}
              >
                <option>Art</option>
                <option>Experiences</option>
                <option>Merchandise</option>
                <option>Charity</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              placeholder="Details about the item, the cause, etc."
              className="mt-1 w-full px-4 py-2 rounded-md border min-h-[100px]"
              onChange={handleChange}
              value={formData.description}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">End Date *</label>
            <input
              name="endDate"
              type="datetime-local"
              className="mt-1 w-full px-4 py-2 rounded-md border"
              onChange={handleChange}
              value={formData.endDate}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-[#F4C15D] py-2.5 rounded-lg text-[#1E1635] font-semibold hover:bg-[#e4b24e] disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create Auction"}
          </button>
        </form>
      </div>
    </div>
  );
}
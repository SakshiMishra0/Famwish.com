"use client";

import { useState } from "react";
import { X, LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }
    alert("Logged in successfully!");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg relative animate-slideUp">
        <button onClick={onClose} className="absolute right-3 top-3 text-gray-600 hover:text-black">
          <X />
        </button>

        <h2 className="text-xl font-bold text-center mb-4">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            className="px-4 py-2 rounded-md border border-gray-300 focus:ring focus:ring-[#2F235A]"
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="px-4 py-2 rounded-md border border-gray-300 focus:ring focus:ring-[#2F235A]"
            onChange={handleChange}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="bg-[#2F235A] text-white py-2 rounded-lg hover:bg-[#463985] transition flex items-center justify-center gap-2"
          >
            <LogIn size={18} /> Log In
          </button>
        </form>

        <p className="text-center text-sm mt-3">
          Don’t have an account?{" "}
          <span
            onClick={() => {
              onClose();
              document.dispatchEvent(new Event("open-signup-modal"));
            }}
            className="text-[#2F235A] font-semibold cursor-pointer"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

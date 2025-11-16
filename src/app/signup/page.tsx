
"use client";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [role, setRole] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F3EC] px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-extrabold text-center mb-6">
          Join Famwish — Make Wishes Come True
        </h2>
        
        <div className="mb-4">
          <label className="font-medium text-sm text-[#463985]">
            Who are you?
          </label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {["Celebrity", "Bidder", "NGO"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r.toLowerCase())}
                className={`py-3 rounded-xl border ${
                  role === r.toLowerCase()
                    ? "bg-[#1E1635] text-white"
                    : "bg-white text-[#463985] border-[#D5D0C7]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <form className="grid gap-4 mt-6">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full rounded-xl border border-[#D5D0C7] p-3 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-[#D5D0C7] p-3 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-[#D5D0C7] p-3 text-sm"
          />
          {role === "celebrity" && (
            <input
              type="text"
              placeholder="Instagram or Twitter Profile URL"
              className="w-full rounded-xl border border-[#D5D0C7] p-3 text-sm"
            />
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#1E1635] text-white py-3 font-semibold hover:bg-[#463985]"
          >
            Sign up
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-[#6A6674]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#2F235A] font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

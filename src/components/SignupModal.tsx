"use client";

import { useState, useEffect } from "react";
import { X, Star, User, HeartHandshake, LogIn } from "lucide-react";

export default function SignupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<"celebrity" | "bidder" | "ngo" | null>(null);
  const [formData, setFormData] = useState<any>({});

  const roles = [
    { key: "celebrity", label: "Celebrity", icon: <Star /> },
    { key: "bidder", label: "Bidder", icon: <User /> },
    { key: "ngo", label: "NGO", icon: <HeartHandshake /> },
  ];
   useEffect(() => {
  const handler = () => onClose();
  document.addEventListener("open-signup-modal", handler);
  return () => document.removeEventListener("open-signup-modal", handler);
}, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const renderSignupFields = () => {
    switch (role) {
      case "celebrity":
        return (
          <>
            <input name="fullName" placeholder="Full Name" onChange={handleChange} />
            <input name="instagram" placeholder="Instagram Profile URL" onChange={handleChange} />
            <input name="youtube" placeholder="YouTube / Twitter URL" onChange={handleChange} />
            <textarea name="bio" placeholder="Short Bio (optional)" onChange={handleChange} />
          </>
        );
      case "ngo":
        return (
          <>
            <input name="orgName" placeholder="Organization Name" onChange={handleChange} />
            <input name="regNumber" placeholder="Registration Number" onChange={handleChange} />
            <input name="website" placeholder="Website URL (optional)" onChange={handleChange} />
            <textarea name="mission" placeholder="Mission Statement" onChange={handleChange} />
          </>
        );
      default:
        return (
          <>
            <input name="fullName" placeholder="Full Name" onChange={handleChange} />
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
          </>
        );
    }
  };

  const renderGoogleLogin = () => (
    <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-md text-sm hover:bg-gray-50">
      <img src="/google.svg" alt="Google icon" className="w-5 h-5" />
      Continue with Google
    </button>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-slideUp">
        <button onClick={onClose} className="absolute right-3 top-3 text-gray-500 hover:text-black">
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          {mode === "signup" ? "Create your account" : "Log in to your account"}
        </h2>

        {/* Google Login - only for Bidders */}
        {mode === "signup" && role === "bidder" && renderGoogleLogin()}

        {/* Divider */}
        {role === "bidder" && (
          <div className="flex items-center my-4">
            <div className="flex-1 border-t"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t"></div>
          </div>
        )}

        {/* Signup Form or Role Selector */}
        {mode === "signup" ? (
          <>
            {!role ? (
              <div className="flex flex-col gap-3">
                {roles.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setRole(key as any)}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:border-[#2F235A] hover:bg-gray-50"
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Signed up as ${role}!`);
                  onClose();
                }}
                className="flex flex-col gap-3"
              >
                {renderSignupFields()}
                <button
                  type="submit"
                  className="mt-3 w-full bg-[#2F235A] py-2 rounded-lg text-white hover:bg-[#463985]"
                >
                  Sign Up
                </button>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <button className="mt-3 w-full bg-[#2F235A] py-2 rounded-lg text-white hover:bg-[#463985]">
              Log In
            </button>
          </form>
        )}

        {/* Footer toggle */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-[#2F235A] font-medium">
                Log in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-[#2F235A] font-medium">
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

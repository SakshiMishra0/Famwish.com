"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, User, HeartHandshake, UploadCloud } from "lucide-react";

const roles = [
  { key: "bidder", label: "Bidder", icon: <User /> },
  { key: "celebrity", label: "Celebrity", icon: <Star /> },
  { key: "ngo", label: "NGO", icon: <HeartHandshake /> },
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"celebrity" | "bidder" | "ngo" | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    orgName: "",
    regNumber: "",
    instagram: "",
    profilePicture: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (session?.user?.profileCompleted) {
      router.push("/profile/me");
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setFormData((prev) => ({ ...prev, profilePicture: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData((prev) => ({ ...prev, profilePicture: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedRole) {
      setError("Please select a role to continue.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          fullName: formData.fullName,
          orgName: formData.orgName,
          regNumber: formData.regNumber,
          instagram: formData.instagram,
          profilePicture: formData.profilePicture,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to complete onboarding.");
      }

      window.location.href = "/profile/me";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EC]">
        <div className="rounded-2xl bg-white p-10 shadow-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EC] px-4 py-12">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-8 md:p-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1E1635]">Complete Your Profile</h1>
          <p className="mt-3 text-sm text-gray-600">
            Welcome {session?.user?.name || "friend"}. Choose your role and finish onboarding to access FamWish.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select your role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedRole(key as any)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selectedRole === key
                      ? "border-[#2F235A] bg-[#F4F2EE]"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="text-[#2F235A]">{icon}</div>
                    <span className="font-semibold">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedRole && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {(selectedRole === "bidder" || selectedRole === "celebrity") && (
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="rounded-xl border px-4 py-3"
                    required
                  />
                )}

                {selectedRole === "ngo" && (
                  <>
                    <input
                      name="orgName"
                      value={formData.orgName}
                      onChange={handleChange}
                      placeholder="Organization Name"
                      className="rounded-xl border px-4 py-3"
                      required
                    />
                    <input
                      name="regNumber"
                      value={formData.regNumber}
                      onChange={handleChange}
                      placeholder="Registration Number"
                      className="rounded-xl border px-4 py-3"
                    />
                  </>
                )}

                {selectedRole === "celebrity" && (
                  <input
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="Instagram profile URL"
                    className="rounded-xl border px-4 py-3"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Profile photo (optional)
                </label>
                <label className="relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <UploadCloud size={24} />
                      <span>Upload Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#2F235A] py-4 text-white transition hover:bg-[#463985] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? "Saving profile..." : "Complete Onboarding"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export function showToast(message: string) {
  if (typeof window !== "undefined") {
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#22163F] text-white px-4 py-2 rounded-lg shadow-lg z-50";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

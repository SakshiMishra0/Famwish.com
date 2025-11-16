// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Famwish. All rights reserved.</p>
        <div className="flex gap-4">
          <button className="hover:text-pink-300">Terms</button>
          <button className="hover:text-pink-300">Privacy</button>
          <button className="hover:text-pink-300">Contact</button>
        </div>
      </div>
    </footer>
  );
}

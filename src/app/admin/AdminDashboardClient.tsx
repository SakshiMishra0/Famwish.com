"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { joinAdminRoom, getSocketClient } from "@/lib/socket-client";
import { Cpu, Database, Sparkles } from "lucide-react";

interface RedisStatus {
  connected: boolean;
  ready: boolean;
  fallbackMode: boolean;
  lastError: string | null;
  url: string;
}

interface AdminAuctionRow {
  auctionId: string;
  title: string;
  currentHighBid: number;
  topBidder: string;
  viewers: number;
  lockStatus: string;
  auctionType: string;
}

interface AdminEvent {
  id: string;
  timestamp: string;
  message: string;
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [redisStatus, setRedisStatus] = useState<RedisStatus | null>(null);
  const [socketStatus, setSocketStatus] = useState<Record<string, unknown> | null>(null);
  const [auctions, setAuctions] = useState<AdminAuctionRow[]>([]);
  const [logs, setLogs] = useState<AdminEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && session && session.user.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const socketPromise = async () => {
      try {
        const socket = await joinAdminRoom();
        socket.on("admin_event", (payload: Record<string, unknown>) => {
          const message = `[${payload.event}] ${payload.auctionId || "system"}`;
          addLog(message);
          fetchStatus();
          fetchAuctions();
        });
        socket.on("connect", () => addLog("Socket connected to admin room."));
        socket.on("disconnect", () => addLog("Socket disconnected."));
      } catch (err) {
        addLog("Failed to connect to admin socket.");
      }
    };
    socketPromise();
    return () => {
      if (typeof window !== "undefined") {
        getSocketClient().then((socket) => {
          socket.off("admin_event");
          socket.off("connect");
          socket.off("disconnect");
        });
      }
    };
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchAuctions();
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [
      { id: `${Date.now()}-${prev.length}`, timestamp: new Date().toISOString(), message },
      ...prev.slice(0, 49),
    ]);
  };

  const fetchStatus = async () => {
    const res = await fetch("/api/admin/status");
    if (res.ok) {
      const data = await res.json();
      setRedisStatus(data.redis);
      setSocketStatus(data.socket);
    } else {
      addLog("Failed to fetch admin status.");
    }
  };

  const fetchAuctions = async () => {
    const res = await fetch("/api/admin/auctions");
    if (res.ok) {
      const data = await res.json();
      setAuctions(data);
    } else {
      addLog("Failed to load auctions.");
    }
  };

  const runAction = async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(true);
    setActiveAction(action);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`Action ${action} failed: ${data.error || res.statusText}`);
      } else {
        addLog(`Action ${action} completed: ${data.message}`);
      }
    } catch (error) {
      addLog(`Action ${action} error: ${String(error)}`);
    } finally {
      setBusy(false);
      setActiveAction("");
      fetchStatus();
      fetchAuctions();
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Admin Dashboard</p>
              <h1 className="mt-3 text-3xl font-bold text-[#1E1635]">Backend observability & tooling</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Database size={20} />
              <span>{redisStatus?.connected ? "Redis connected" : "Redis unavailable"}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-[#FEFEFF] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Redis status</p>
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold">{redisStatus?.connected ? "Connected" : "Disconnected"}</p>
                <p className="text-sm text-gray-500">Fallback mode: {redisStatus?.fallbackMode ? "Yes" : "No"}</p>
                <p className="text-sm text-gray-500">Ready: {redisStatus?.ready ? "Yes" : "No"}</p>
                <p className="text-sm text-gray-500">Last error: {redisStatus?.lastError ?? "None"}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-[#FEFEFF] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Websocket status</p>
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold">{socketStatus?.initialized ? "Ready" : "Pending"}</p>
                <p className="text-sm text-gray-500">Rooms: {socketStatus?.rooms?.length ?? 0}</p>
                <p className="text-sm text-gray-500">Auction rooms: {socketStatus?.auctionRoomCount ?? 0}</p>
                <p className="text-sm text-gray-500">Admin listeners: {socketStatus?.adminRoomCount ?? 0}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-[#FEFEFF] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">API tools</p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p>Use the controls below to exercise the live auction backend.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">API Testing</h2>
                  <p className="text-sm text-gray-500">Create auctions, place test bids, close auctions, and emit socket events.</p>
                </div>
                <div className="rounded-2xl bg-[#F4F2EE] px-3 py-2 text-sm text-[#2F235A] flex items-center gap-2">
                  <Sparkles size={16} /> Live tooling
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  disabled={busy}
                  onClick={() => runAction("create_fake_auction", { auctionType: "charity", ngoPartnerId: "000000000000000000000000" })}
                  className="rounded-3xl bg-[#2F235A] px-5 py-4 text-left text-white hover:bg-[#463985] transition"
                >
                  <p className="font-semibold">Create fake charity auction</p>
                  <p className="text-sm text-[#D9D4FF] mt-1">Generates a test auction in the database.</p>
                </button>
                <button
                  disabled={busy}
                  onClick={() => runAction("emit_test_event", { auctionId: auctions?.[0]?.auctionId })}
                  className="rounded-3xl border border-gray-200 bg-white px-5 py-4 text-left text-[#1E1635] hover:border-[#463985] transition"
                >
                  <p className="font-semibold">Emit test socket event</p>
                  <p className="text-sm text-gray-500 mt-1">Pushes a sample event to the admin socket room.</p>
                </button>
                <button
                  disabled={busy || !auctions?.[0]}
                  onClick={() => runAction("place_test_bid", { auctionId: auctions[0]?.auctionId, bidAmount: (auctions[0]?.currentHighBid || 0) + 100 })}
                  className="rounded-3xl bg-[#F4F2EE] px-5 py-4 text-left text-[#2F235A] hover:bg-[#E9E5DB] transition"
                >
                  <p className="font-semibold">Place test bid</p>
                  <p className="text-sm text-[#443F54] mt-1">Increments the highest bid for the first auction.</p>
                </button>
                <button
                  disabled={busy || !auctions?.[0]}
                  onClick={() => runAction("close_auction", { auctionId: auctions[0]?.auctionId })}
                  className="rounded-3xl border border-gray-200 bg-white px-5 py-4 text-left text-[#1E1635] hover:border-red-300 transition"
                >
                  <p className="font-semibold">Close auction</p>
                  <p className="text-sm text-gray-500 mt-1">Sets the first auction to closed state.</p>
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>Current action: {activeAction || "idle"}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Live Logs</h2>
                  <p className="text-sm text-gray-500">Websocket and API events captured in real time.</p>
                </div>
                <div className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs text-[#4338CA]">{logs.length} entries</div>
              </div>
              <div className="mt-5 max-h-80 overflow-y-auto rounded-3xl border border-gray-100 bg-[#F8FAFC] p-4 text-sm text-gray-700">
                {logs.length === 0 ? (
                  <p className="text-gray-400">No events received yet.</p>
                ) : (
                  logs.map((entry) => (
                    <div key={entry.id} className="mb-3 border-b border-gray-200 pb-3 last:border-none">
                      <p className="font-medium">{entry.message}</p>
                      <p className="mt-1 text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
              <h2 className="text-xl font-bold">Active Auctions</h2>
              <p className="text-sm text-gray-500 mt-2">Live auction state and lock status for the most recent items.</p>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 pr-4">Auction</th>
                      <th className="py-3 pr-4">Current Bid</th>
                      <th className="py-3 pr-4">Top Bidder</th>
                      <th className="py-3 pr-4">Viewers</th>
                      <th className="py-3 pr-4">Lock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auctions.map((row) => (
                      <tr key={row.auctionId} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-[#22163F]">{row.title}</td>
                        <td className="py-3 pr-4">₹{row.currentHighBid.toLocaleString("en-IN")}</td>
                        <td className="py-3 pr-4">{row.topBidder}</td>
                        <td className="py-3 pr-4">{row.viewers}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.lockStatus === "locked" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {row.lockStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 text-[#2F235A]">
                <Cpu size={20} />
                <h2 className="text-xl font-bold">Redis metrics</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#F4F2EE] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ping</p>
                  <p className="mt-2 text-lg font-semibold">{redisStatus?.ready ? "OK" : "Unavailable"}</p>
                </div>
                <div className="rounded-3xl bg-[#F4F2EE] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Mode</p>
                  <p className="mt-2 text-lg font-semibold">{redisStatus?.fallbackMode ? "Fallback" : "Normal"}</p>
                </div>
                <div className="rounded-3xl bg-[#F4F2EE] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Last error</p>
                  <p className="mt-2 text-sm text-gray-600">{redisStatus?.lastError || "None"}</p>
                </div>
                <div className="rounded-3xl bg-[#F4F2EE] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Endpoint</p>
                  <p className="mt-2 text-sm text-gray-600">{redisStatus?.url || "Unknown"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

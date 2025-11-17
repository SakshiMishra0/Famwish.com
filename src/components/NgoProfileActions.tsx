// src/components/NgoProfileActions.tsx
"use client";

import React from 'react';
import Link from 'next/link';

interface Props {
  ngoName: string;
}

export default function NgoProfileActions({ ngoName }: Props) {
    
    const handleVerifyClick = (message: string) => {
        alert(message);
    }
    
    return (
        <div className="space-y-6">
            
            {/* HERO ACTIONS */}
            <div className="flex flex-wrap gap-2 mt-4">
                <button
                    className="bg-[#22163F] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#463985]"
                    onClick={() => alert(`Donate to ${ngoName}`)}
                >
                    Donate
                </button>
                <button
                    className="bg-transparent text-[#22163F] border border-[#e6e6e6] rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    onClick={() => alert("Open create auction flow")}
                >
                    Create Auction
                </button>
                <button
                    className="bg-white text-[#22163F] border border-[#e6e6e6] rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    onClick={() => alert("Followed!")}
                >
                    Follow
                </button>
            </div>
            
            {/* LEDGER CARD (Moved here) */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#E8E3DB] p-5 flex flex-col">
                  <h3 className="text-[#22163F] font-semibold text-xl mb-4">
                    Public Immutable Ledger
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#6B6B6B]">
                      This is static/mock ledger data for now.
                    </p>
                    <button
                        onClick={() => handleVerifyClick("Ledger verification logic needs to be implemented as a client-side function.")}
                        className="px-3 py-1 rounded-lg bg-[#22163F] text-white text-xs hover:bg-[#463985]"
                    >
                        Verify
                    </button>
                  </div>
            </div>

        </div>
    );
}
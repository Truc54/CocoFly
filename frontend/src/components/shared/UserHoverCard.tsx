"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { HoverCard } from "radix-ui";
import { userApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

interface PublicProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  rating: number;
  totalReviews: number;
  role: string;
  joinDate: string;
}

export default function UserHoverCard({ userId, children }: UserHoverCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = authStorage.getUser();
    if (user) {
      setCurrentUserId((user as { id: string }).id);
    }
  }, []);

  if (!userId) {
    return <span className="inline-flex items-center">{children}</span>;
  }

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    // Don't show hover card if it's the logged-in user themselves
    if (isOpen && userId !== currentUserId) {
      if (!profile && !loading) {
        setLoading(true);
        try {
          const res = await userApi.getUserProfile(userId);
          setProfile(res.data);
        } catch (err) {
          console.error("Failed to load user public profile:", err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const isOwn = currentUserId === userId;
  const profileUrl = isOwn ? "/profile" : `/profile/${userId}`;

  // If hovering over themselves, we just render the children without hover card
  if (isOwn) {
    return (
      <Link href="/profile" className="hover:underline cursor-pointer inline-flex items-center">
        {children}
      </Link>
    );
  }

  return (
    <HoverCard.Root open={open} onOpenChange={handleOpenChange} openDelay={300} closeDelay={300}>
      <HoverCard.Trigger asChild>
        <Link href={profileUrl} className="hover:underline cursor-pointer inline-flex items-center">
          {children}
        </Link>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-[320px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-5 rounded-xl animate-in fade-in zoom-in-95 duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : profile ? (
            <div className="space-y-4">
              {/* Header: Avatar + Name & Join Date */}
              <div className="flex gap-4">
                {/* Avatar */}
                <Link
                  href={profileUrl}
                  className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-600 shadow-[2px_2px_0px_#E2B9A1] overflow-hidden shrink-0 block hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={profile.avatarUrl || "/default-avatar.svg"}
                    alt={profile.fullName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link href={profileUrl} className="block hover:underline">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                      {profile.fullName}
                    </h4>
                  </Link>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({profile.totalReviews} đánh giá)
                    </span>
                  </div>

                  {/* Join Date */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Tham gia {new Date(profile.joinDate).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Link
                  href={profileUrl}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 border-2 border-blue-600 shadow-[2px_2px_0px_#93C5FD] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#93C5FD] transition-all rounded-xl text-center text-xs"
                >
                  Xem trang cá nhân
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    const isLoggedIn = !!authStorage.getToken();
                    if (!isLoggedIn) {
                      router.push("/login");
                    } else {
                      window.dispatchEvent(new CustomEvent("open-dm", { detail: { targetUserId: userId } }));
                    }
                  }}
                  className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-300 font-bold py-2 border-2 border-blue-600 dark:border-blue-400 shadow-[2px_2px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#bfdbfe] transition-all rounded-xl text-center text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Nhắn tin
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-slate-400 py-4">Không thể tải thông tin</p>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

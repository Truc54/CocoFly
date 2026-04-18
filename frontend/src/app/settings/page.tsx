"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Lock,
  Mail,
  Phone,
  Camera,
  Eye,
  EyeOff,
  ShieldCheck,
  Save,
  Loader2,
} from "lucide-react";

// ─── Mock User Data ──────────────────────────────────────────────────────────
const MOCK_USER = {
  fullName: "Trực Trần",
  email: "truc@gmail.com",
  phone: "0909123456",
  avatarUrl: "/default-avatar.svg",
  phoneVerified: true,
};

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────
function FieldInput({ label, icon, type = "text", value, onChange, disabled, suffix }: {
  label: string; icon: React.ReactNode; type?: string; value: string;
  onChange: (v: string) => void; disabled?: boolean; suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-11 rounded-lg border border-input bg-transparent pl-10 pr-3 text-sm outline-none
            focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all
            disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [fullName, setFullName] = useState(MOCK_USER.fullName);
  const [email] = useState(MOCK_USER.email);
  const [phone] = useState(MOCK_USER.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Cài đặt tài khoản</h1>

        {/* Success Toast */}
        {saveSuccess && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            <ShieldCheck className="w-4 h-4" />
            Đã lưu thay đổi thành công!
          </div>
        )}

        <div className="space-y-6">
          {/* ── Avatar Section ─────────────────────────────────────────── */}
          <SettingsSection title="Ảnh đại diện">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-primary/20">
                  <Image src={MOCK_USER.avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div>
                <button className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                  Thay đổi ảnh
                </button>
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG. Tối đa 5MB.</p>
              </div>
            </div>
          </SettingsSection>

          {/* ── Personal Info ──────────────────────────────────────────── */}
          <SettingsSection title="Thông tin cá nhân" description="Chỉnh sửa tên hiển thị và thông tin liên hệ">
            <div className="space-y-4">
              <FieldInput label="Họ và tên" icon={<User className="w-4 h-4" />} value={fullName} onChange={setFullName} />
              <FieldInput
                label="Email"
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={() => {}}
                disabled
                suffix={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
              />
              <FieldInput
                label="Số điện thoại"
                icon={<Phone className="w-4 h-4" />}
                value={phone}
                onChange={() => {}}
                disabled
                suffix={MOCK_USER.phoneVerified ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : undefined}
              />

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </SettingsSection>

          {/* ── Security ───────────────────────────────────────────────── */}
          <SettingsSection title="Bảo mật" description="Bảo vệ tài khoản với mật khẩu an toàn">
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
               <div>
                  <p className="text-sm font-medium text-foreground mb-1">Mật khẩu</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Cập nhật mật khẩu để bảo vệ tài khoản</p>
               </div>
               <Link
                  href="/change-password"
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors inline-block"
                >
                  Đổi mật khẩu
               </Link>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

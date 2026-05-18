"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import {
  ArrowRight,
  ArrowLeft,
  Package,
  ImagePlus,
  Gavel,
  CheckCircle2,
  X,
  Upload,
  GripVertical,
  Clock,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaApi, auctionApi, categoryApi } from "@/lib/api";
import { CustomSelect, CustomDateTimePicker } from "./custom-inputs";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

const STEPS = [
  { label: "Sản phẩm", icon: Package },
  { label: "Hình ảnh", icon: ImagePlus },
  { label: "Đấu giá", icon: Gavel },
  { label: "Xác nhận", icon: CheckCircle2 },
];

const CONDITIONS = [
  { value: "new_item", label: "Mới (Chưa sử dụng)" },
  { value: "like_new", label: "Như mới" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Khá" },
  { value: "poor", label: "Cần sửa chữa" },
];



interface MediaItem {
  cdnUrl: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  sortOrder: number;
  preview: string;
}

interface FormData {
  title: string;
  categoryId: number | null;
  condition: string;
  description: string;
  brand: string;
  location: string;
  media: MediaItem[];
  startingPrice: number | "";
  bidIncrement: number | "";
  buyoutPrice: number | "";
  scheduledStart: string;
  endTime: string;
  autoExtend: boolean;
  autoExtendMinutes: number;
  autoExtendThreshold: number;
  startImmediately: boolean;
}

const initialFormData: FormData = {
  title: "",
  categoryId: null,
  condition: "good",
  description: "",
  brand: "",
  location: "",
  media: [],
  startingPrice: "",
  bidIncrement: 1000,
  buyoutPrice: "",
  scheduledStart: "",
  endTime: "",
  autoExtend: true,
  autoExtendMinutes: 5,
  autoExtendThreshold: 5,
  startImmediately: false,
};

function formatVND(value: number | ""): string {
  if (value === "" || value === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(Number(value));
}

function parseVND(value: string): number | "" {
  const num = value.replace(/[^\d]/g, "");
  return num === "" ? "" : parseInt(num, 10);
}

export default function CreateAuctionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isClosingToast, setIsClosingToast] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoryApi.getAll();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateForm = useCallback((updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    const keys = Object.keys(updates);
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  // ─── VALIDATION ───
  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!form.title.trim()) errs.title = "Tiêu đề sản phẩm là bắt buộc";
      else if (form.title.length > 255) errs.title = "Tiêu đề không được vượt quá 255 ký tự";
      if (!form.categoryId) errs.categoryId = "Vui lòng chọn danh mục";
      if (!form.condition) errs.condition = "Vui lòng chọn tình trạng";
    }

    if (s === 1) {
      if (form.media.length === 0) errs.media = "Cần ít nhất 1 hình ảnh sản phẩm";
    }

    if (s === 2) {
      if (form.startingPrice === "" || form.startingPrice < 0) errs.startingPrice = "Giá khởi điểm phải >= 0";
      if (form.bidIncrement === "" || form.bidIncrement <= 0) errs.bidIncrement = "Bước giá phải > 0";
      if (form.buyoutPrice !== "" && form.startingPrice !== "" && form.buyoutPrice <= form.startingPrice) {
        errs.buyoutPrice = "Giá mua ngay phải lớn hơn giá khởi điểm";
      }
      if (!form.startImmediately) {
        if (!form.scheduledStart) errs.scheduledStart = "Vui lòng chọn thời gian bắt đầu";
        else if (new Date(form.scheduledStart) < new Date()) errs.scheduledStart = "Thời gian bắt đầu phải ở tương lai";
      }

      const effectiveStart = form.startImmediately ? new Date() : new Date(form.scheduledStart || new Date());
      if (!form.endTime) {
        errs.endTime = "Vui lòng chọn thời gian kết thúc";
      } else if (new Date(form.endTime) <= effectiveStart) {
        errs.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
      } else if (new Date(form.endTime).getTime() - effectiveStart.getTime() < 3600000) {
        errs.endTime = "Phiên đấu giá phải kéo dài ít nhất 1 giờ";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      const nextStep = Math.min(step + 1, 3);
      setStep(nextStep);
      setMaxStepReached((prev) => Math.max(prev, nextStep));
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // ─── IMAGE UPLOAD ───
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setErrors((prev) => ({ ...prev, media: "" }));

    try {
      const sigRes = await mediaApi.getUploadSignature();
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

      const newMedia: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const formData = new window.FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        const uploadData = await uploadRes.json();

        if (uploadData.secure_url) {
          newMedia.push({
            cdnUrl: uploadData.secure_url,
            storageKey: uploadData.public_id,
            mimeType: file.type,
            fileSize: file.size,
            width: uploadData.width || 0,
            height: uploadData.height || 0,
            sortOrder: form.media.length + i,
            preview: uploadData.secure_url,
          });
        }
      }

      updateForm({ media: [...form.media, ...newMedia] });
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        media: err.message || "Upload thất bại. Vui lòng thử lại.",
      }));
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    const updated = form.media.filter((_, i) => i !== index).map((m, i) => ({ ...m, sortOrder: i }));
    updateForm({ media: updated });
  }

  // ─── DRAG-TO-REORDER ───
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const reordered = [...form.media];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      const updated = reordered.map((m, i) => ({ ...m, sortOrder: i }));
      updateForm({ media: updated });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  // ─── SUBMIT ───
  async function handleSubmit() {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId,
        condition: form.condition,
        description: form.description || undefined,
        brand: form.brand || undefined,
        location: form.location || undefined,
        media: form.media.map(({ preview, ...rest }) => rest),
        auctionType: "english",
        startingPrice: Number(form.startingPrice),
        bidIncrement: Number(form.bidIncrement),
        buyoutPrice: form.buyoutPrice !== "" ? Number(form.buyoutPrice) : undefined,
        scheduledStart: form.startImmediately ? new Date().toISOString() : new Date(form.scheduledStart).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        autoExtend: form.autoExtend,
        autoExtendMinutes: form.autoExtendMinutes,
        autoExtendThreshold: form.autoExtendThreshold,
      };

      await auctionApi.create(payload);
      
      setForm(initialFormData);
      setStep(0);
      setMaxStepReached(0);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setShowSuccessToast(true);
      setIsClosingToast(false);
      setTimeout(() => setIsClosingToast(true), 4700);
      setTimeout(() => {
        setShowSuccessToast(false);
        setIsClosingToast(false);
      }, 5000);
    } catch (err: any) {
      setSubmitError(err.message || "Tạo đấu giá thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── SHARED STYLES ───
  const inputClass =
    "h-12 w-full border-2 border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-[3px_3px_0px_#cbd5e1] outline-none transition-all focus:-translate-y-0.5 focus:border-primary-main focus:shadow-[4px_4px_0px_#E2B9A1] focus:ring-0 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:shadow-[3px_3px_0px_#334155] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:cursor-pointer";
  const labelClass =
    "block text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5";
  const errorClass = "text-xs text-red-500 mt-1 font-medium";

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/80 border-b border-primary/10 sticky top-[57px] z-40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Step Indicator */}
          {step < 4 && (
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isReachable = i <= maxStepReached;
                const isDone = i < step;
                return (
                  <React.Fragment key={i}>
                    <button
                      onClick={() => { if (isReachable) setStep(i); }}
                      disabled={!isReachable}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all
                        ${isActive ? "bg-primary text-white shadow-[3px_3px_0px_#E2B9A1]" : ""}
                        ${!isActive && isReachable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:-translate-y-0.5" : ""}
                        ${!isReachable ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed" : ""}
                      `}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 ${i < maxStepReached ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-8">
        {/* ─── STEP 0: Product Info ─── */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Thông tin sản phẩm
              </h2>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className={labelClass}>Tiêu đề sản phẩm *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    placeholder="VD: iPhone 15 Pro Max 256GB chính hãng"
                    maxLength={255}
                    className={inputClass}
                  />
                  {errors.title && <p className={errorClass}>{errors.title}</p>}
                </div>

                {/* Category + Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Danh mục *</label>
                    <CustomSelect
                      value={form.categoryId}
                      onChange={(val) => updateForm({ categoryId: val ? parseInt(val as string) : null })}
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      placeholder={isLoadingCategories ? "Đang tải..." : "-- Chọn danh mục --"}
                      hasError={!!errors.categoryId}
                    />
                    {errors.categoryId && <p className={errorClass}>{errors.categoryId}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Tình trạng *</label>
                    <CustomSelect
                      value={form.condition}
                      onChange={(val) => updateForm({ condition: val as string })}
                      options={CONDITIONS.map(c => ({ value: c.value, label: c.label }))}
                      placeholder="-- Chọn tình trạng --"
                      hasError={!!errors.condition}
                    />
                    {errors.condition && <p className={errorClass}>{errors.condition}</p>}
                  </div>
                </div>

                {/* Brand + Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Thương hiệu</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => updateForm({ brand: e.target.value })}
                      placeholder="VD: Apple, Samsung..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Địa điểm</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => updateForm({ location: e.target.value })}
                      placeholder="VD: TP. Hồ Chí Minh"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>Mô tả chi tiết</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Mô tả sản phẩm, tình trạng sử dụng, phụ kiện đi kèm..."
                    rows={4}
                    className={`${inputClass} h-auto py-3 resize-none`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 1: Images ─── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-primary" /> Hình ảnh sản phẩm
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Ảnh đầu tiên sẽ là ảnh đại diện (thumbnail). Kéo thả để sắp xếp lại thứ tự.
              </p>

              {errors.media && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errors.media}
                </div>
              )}

              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files); }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center transition-all hover:border-primary hover:bg-primary/5 group cursor-pointer"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Đang tải ảnh lên...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-medium text-slate-500">
                      Kéo thả ảnh vào đây hoặc <span className="text-primary font-bold">nhấn để chọn</span>
                    </p>
                    <p className="text-xs text-slate-400">PNG, JPG, WEBP (tối đa 10 ảnh)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </div>

              {/* Preview Gallery — Drag to reorder */}
              {form.media.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {form.media.map((m, i) => (
                    <div
                      key={m.storageKey}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`relative group border-2 overflow-hidden aspect-square bg-slate-50 dark:bg-slate-800 cursor-grab active:cursor-grabbing transition-all duration-200
                        ${dragIndex === i ? "opacity-40 scale-95 border-primary" : ""}
                        ${dragOverIndex === i && dragIndex !== i ? "border-primary ring-2 ring-primary/30 scale-105" : "border-slate-200 dark:border-slate-700"}
                      `}
                    >
                      <img
                        src={m.preview}
                        alt={`Ảnh ${i + 1}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                          Thumbnail
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5 text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3 inline mr-1" />Kéo để sắp xếp • #{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Auction Settings ─── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Price Card */}
            <div className="bg-white dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" /> Thiết lập giá
              </h2>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Giá khởi điểm (VNĐ) *</label>
                    <input
                      type="text"
                      value={formatVND(form.startingPrice)}
                      onChange={(e) => updateForm({ startingPrice: parseVND(e.target.value) })}
                      placeholder="0"
                      className={inputClass}
                    />
                    {errors.startingPrice && <p className={errorClass}>{errors.startingPrice}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Bước giá (VNĐ) *</label>
                    <input
                      type="text"
                      value={formatVND(form.bidIncrement)}
                      onChange={(e) => updateForm({ bidIncrement: parseVND(e.target.value) })}
                      placeholder="1,000"
                      className={inputClass}
                    />
                    {errors.bidIncrement && <p className={errorClass}>{errors.bidIncrement}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Giá mua ngay (VNĐ) <span className="text-slate-400 normal-case font-normal">tùy chọn</span></label>
                  <input
                    type="text"
                    value={formatVND(form.buyoutPrice)}
                    onChange={(e) => updateForm({ buyoutPrice: parseVND(e.target.value) })}
                    placeholder="Để trống nếu không cần"
                    className={inputClass}
                  />
                  {errors.buyoutPrice && <p className={errorClass}>{errors.buyoutPrice}</p>}
                </div>
              </div>
            </div>

            {/* Time Card */}
            <div className="bg-white dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Thời gian
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bắt đầu ngay lập tức</span>
                  <button
                    onClick={() => updateForm({ startImmediately: !form.startImmediately, scheduledStart: "" })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.startImmediately ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${form.startImmediately ? "translate-x-6" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Bắt đầu *</label>
                  <div className="relative">
                    <div className={form.startImmediately ? "opacity-40 grayscale" : ""}>
                      <CustomDateTimePicker
                        value={form.scheduledStart}
                        onChange={(val) => updateForm({ scheduledStart: val })}
                        placeholder="Chọn thời gian bắt đầu"
                        hasError={!!errors.scheduledStart && !form.startImmediately}
                      />
                    </div>
                    {form.startImmediately && (
                      <div className="absolute inset-0 z-10 cursor-default" title="Đã chọn bắt đầu ngay lập tức" />
                    )}
                  </div>
                  {errors.scheduledStart && !form.startImmediately && <p className={errorClass}>{errors.scheduledStart}</p>}
                </div>
                <div>
                  <label className={labelClass}>Kết thúc *</label>
                  <CustomDateTimePicker
                    value={form.endTime}
                    onChange={(val) => updateForm({ endTime: val })}
                    placeholder="Chọn thời gian kết thúc"
                    hasError={!!errors.endTime}
                  />
                  {errors.endTime && <p className={errorClass}>{errors.endTime}</p>}
                </div>
              </div>
            </div>

            {/* Anti-sniping Card */}
            <div className="bg-white dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Chống sniping
                </h2>
                <button
                  onClick={() => updateForm({ autoExtend: !form.autoExtend })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.autoExtend ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${form.autoExtend ? "translate-x-6" : ""}`} />
                </button>
              </div>

              {form.autoExtend && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 animate-in fade-in duration-200">
                  <div>
                    <label className={labelClass}>Ngưỡng kích hoạt (phút cuối)</label>
                    <input
                      type="number"
                      value={form.autoExtendThreshold}
                      onChange={(e) => updateForm({ autoExtendThreshold: parseInt(e.target.value) || 5 })}
                      min={1}
                      max={30}
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-400 mt-1">Đặt giá vào trong khoảng này sẽ kích hoạt gia hạn</p>
                  </div>
                  <div>
                    <label className={labelClass}>Gia hạn thêm (phút)</label>
                    <input
                      type="number"
                      value={form.autoExtendMinutes}
                      onChange={(e) => updateForm({ autoExtendMinutes: parseInt(e.target.value) || 5 })}
                      min={1}
                      max={30}
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-400 mt-1">Mỗi lần kích hoạt, thời gian kết thúc sẽ được cộng thêm</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 3: Review ─── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {submitError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-900">
                <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📋 Xem lại thông tin</h2>

              {/* Product Summary */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  {form.media[0] && (
                    <img src={form.media[0].preview} alt="Thumbnail" className="w-24 h-24 object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">{form.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {categories.find((c) => c.id === form.categoryId)?.name || "Không rõ"} • {CONDITIONS.find((c) => c.value === form.condition)?.label}
                    </p>
                    {form.brand && <p className="text-sm text-slate-500">Thương hiệu: {form.brand}</p>}
                    {form.location && <p className="text-sm text-slate-500">Địa điểm: {form.location}</p>}
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />

                {/* Pricing */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Giá khởi điểm</p>
                    <p className="text-lg font-bold text-primary">{formatVND(form.startingPrice)} đ</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Bước giá</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatVND(form.bidIncrement)} đ</p>
                  </div>
                  {form.buyoutPrice !== "" && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Mua ngay</p>
                      <p className="text-lg font-bold text-emerald-600">{formatVND(form.buyoutPrice)} đ</p>
                    </div>
                  )}
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />

                {/* Timing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Bắt đầu</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {form.startImmediately ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ngay lập tức</span>
                      ) : form.scheduledStart ? (
                        new Date(form.scheduledStart).toLocaleString("vi-VN")
                      ) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Kết thúc</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {form.endTime ? new Date(form.endTime).toLocaleString("vi-VN") : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Chống sniping: {form.autoExtend ? `Bật (${form.autoExtendThreshold} phút cuối ➜ +${form.autoExtendMinutes} phút)` : "Tắt"}
                  </span>
                </div>

                {/* Images Count */}
                <p className="text-sm text-slate-500">{form.media.length} hình ảnh đã upload</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Success Toast ─── */}
        {showSuccessToast && (
          <div className={`fixed top-24 right-6 z-50 transition-all duration-300 ${
            isClosingToast ? "animate-out fade-out slide-out-to-right-8" : "animate-in fade-in slide-in-from-right-8"
          }`}>
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-[4px_4px_0px_#059669] p-4 flex items-center gap-3 w-80">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Tạo đấu giá thành công!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Sản phẩm đã được chuẩn bị lên sàn.</p>
              </div>
              <button 
                onClick={() => {
                  setIsClosingToast(true);
                  setTimeout(() => {
                    setShowSuccessToast(false);
                    setIsClosingToast(false);
                  }, 300);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Navigation Buttons ─── */}
        {step < 4 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={step === 0 ? () => router.back() : handleBack}
              className="h-12 px-6 rounded-none border-2 border-slate-300 bg-white text-base font-bold text-slate-700 shadow-[3px_3px_0px_#cbd5e1] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#cbd5e1] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:shadow-[3px_3px_0px_#334155]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 0 ? "Hủy" : "Quay lại"}
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="group h-12 px-8 rounded-none border-2 border-primary-main bg-primary-main text-base font-bold text-white shadow-[3px_3px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1]"
              >
                Tiếp theo
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group h-12 px-8 rounded-none border-2 border-emerald-600 bg-emerald-600 text-base font-bold text-white shadow-[3px_3px_0px_#059669] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#059669] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
                ) : (
                  <><Gavel className="w-4 h-4 mr-2" /> Tạo đấu giá</>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, startTransition } from "react";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [iconUrl, setIconUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete control
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper: auto-generate slug from name
  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlug(val));
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminApi.categories.list();
      if (res && res.success) {
        setCategories(res.data);
      } else {
        setErrorMsg(res?.message || "Không thể tải danh sách danh mục.");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Đã xảy ra lỗi khi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder(0);
    setIconUrl("");
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setSortOrder(cat.sortOrder);
    setIconUrl(cat.iconUrl || "");
    setIsActive(cat.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên danh mục");
      return;
    }
    if (!slug.trim()) {
      setFormError("Vui lòng nhập slug");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        slug,
        description: description.trim() || undefined,
        parentId: null, // As per flat layout constraint
        sortOrder: Number(sortOrder) || 0,
        iconUrl: iconUrl.trim() || undefined,
        isActive,
      };

      let res;
      if (editingCategory) {
        res = await adminApi.categories.update(editingCategory.id, payload);
      } else {
        res = await adminApi.categories.create(payload);
      }

      if (res && res.success) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        setFormError(res?.message || "Thao tác thất bại");
      }
    } catch (err: unknown) {
      setFormError((err as Error)?.message || "Đã xảy ra lỗi hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (cat: Category) => {
    setDeletingCategory(cat);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setDeleteLoading(true);
      setErrorMsg(null);
      const res = await adminApi.categories.remove(deletingCategory.id);
      if (res && res.success) {
        setDeletingCategory(null);
        fetchCategories();
      } else {
        setErrorMsg(res?.message || "Xóa danh mục thất bại");
        setDeletingCategory(null);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Danh mục này không thể xóa (có thể đang có sản phẩm thuộc danh mục này)");
      setDeletingCategory(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-sans">QUẢN LÝ DANH MỤC</h2>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#8f5c38] hover:bg-[#8f5c38]/90 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-[#8f5c38]/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* Error Alert Bar */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-red-700 animate-[fadeIn_0.2s_ease-out]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-sans flex-1">
            <span className="font-bold">Lỗi thao tác:</span> {errorMsg}
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold font-sans cursor-pointer self-start"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Categories Table Layout */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">Tên danh mục</th>
                <th className="px-6 py-4 whitespace-nowrap">Slug đại diện</th>
                <th className="px-6 py-4 whitespace-nowrap">Mô tả chi tiết</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Thứ tự sắp xếp</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-4 w-32 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-24 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-48 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-10 bg-slate-100 rounded-md mx-auto" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-16 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-8 w-16 bg-slate-100 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
                    Chưa có danh mục nào được khởi tạo.
                  </td>
                </tr>
              ) : (
                categories.map((cat, index) => {
                  const isLowerRow = index >= 4 || index >= categories.length - 2;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{cat.slug}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500 font-sans">
                        {cat.description || <span className="italic text-slate-300">Chưa bổ sung</span>}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">
                        {cat.sortOrder}
                      </td>
                      <td className="px-6 py-4">
                        {cat.isActive ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 whitespace-nowrap inline-block">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-500 rounded-full border border-slate-200 whitespace-nowrap inline-block">
                            Tạm khóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <div className="inline-block relative">
                          <button
                            onClick={() => startTransition(() => {
                              setActiveMenuId(activeMenuId === cat.id ? null : cat.id);
                            })}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                          
                          {activeMenuId === cat.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => startTransition(() => setActiveMenuId(null))}
                              />
                              <div
                                className={`absolute right-0 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-32 z-20 text-left overflow-hidden ${
                                  isLowerRow ? "bottom-full mb-1.5" : "top-full mt-1.5"
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    openEditModal(cat);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                                </button>
                                
                                <button
                                  onClick={() => {
                                    confirmDelete(cat);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => !submitting && setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100 z-10 animate-[scaleUp_0.2s_ease-out]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
                <FolderTree className="w-5 h-5 text-[#8f5c38]" />
                {editingCategory ? "CẬP NHẬT DANH MỤC" : "THÊM DANH MỤC MỚI"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50 text-sm font-bold animate-pulse"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200/60 rounded-xl p-3 flex gap-2 text-red-700 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tên danh mục */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đồ cổ, Đồ gốm..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:outline-hidden transition-all"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Slug đại diện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: do-co, do-gom..."
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:outline-hidden transition-all font-mono"
                  required
                />
              </div>

              {/* Icon URL and Sort Order Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Icon URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Biểu tượng / Icon URL
                  </label>
                  <input
                    type="text"
                    placeholder="URL ảnh hoặc emoji (🏺)"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:outline-hidden transition-all"
                  />
                </div>

                {/* Thứ tự sắp xếp */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    disabled={submitting}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:bg-white focus:border-slate-300 focus:outline-hidden transition-all font-mono"
                    min="0"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả ngắn cho danh mục sản phẩm này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:outline-hidden transition-all resize-none font-sans"
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={submitting}
                  className="w-4.5 h-4.5 rounded-sm border-slate-300 text-[#8f5c38] focus:ring-[#8f5c38] cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Cho phép hoạt động công khai
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8f5c38] hover:bg-[#8f5c38]/90 text-white font-bold rounded-xl text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingCategory ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminConfirmDialog
        isOpen={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="XÓA DANH MỤC"
        description={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.name}"? Thao tác này không thể hoàn tác và chỉ thực hiện được nếu không có sản phẩm nào liên kết.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteLoading}
      />

      <style jsx>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

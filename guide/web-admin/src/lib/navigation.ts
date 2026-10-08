export const ADMIN_SECTIONS = [
  { path: "/admin/services", label: "服务" },
  { path: "/admin/categories", label: "分类" },
  { path: "/admin/themes", label: "主题" },
  { path: "/admin/security", label: "安全" },
  { path: "/admin/settings", label: "设置" },
] as const

export function normaliseAdminPath(path: string) {
  const clean = path.replace(/\/$/, "")
  return ADMIN_SECTIONS.some(section => section.path === clean) ? clean : "/admin/services"
}

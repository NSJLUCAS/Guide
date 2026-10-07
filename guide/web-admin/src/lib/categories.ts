export function categoryOptions(services: { category: string }[]): string[] {
  return [...new Set(services.map(service => service.category.trim()).filter(Boolean))]
}

export function normalizeCategory(value: string): string {
  const category = value.trim()
  if ([...category].length > 100) throw new Error("分类名称最多 100 字符")
  return category
}

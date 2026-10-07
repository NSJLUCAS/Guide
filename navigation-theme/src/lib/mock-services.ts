import type { Service } from "./services"

// UI fixtures only: statuses are illustrative, not real network measurements.
// Private service URLs use reserved example.com domains, never production addresses.
const loadedAt = Date.now()
const checkedAt = (minutes: number) => new Date(loadedAt - minutes * 60_000).toISOString()

export const mockServices: Service[] = [
  { id: 1, name: "Matrix", description: "自己的即时通讯空间", category: "自建服务", icon: "matrix", url: "https://chat.example.com", status: "online", responseMs: 32, checkedAt: checkedAt(1) },
  { id: 2, name: "SimpleX", description: "私密沟通，轻松连接", category: "自建服务", icon: "simplex", url: "https://simplex.example.com", status: "online", responseMs: 41, checkedAt: checkedAt(2) },
  { id: 3, name: "Vaultwarden", description: "个人密码与凭据保险库", category: "自建服务", icon: "vaultwarden", url: "https://vault.example.com", status: "online", responseMs: 64, checkedAt: checkedAt(1) },
  { id: 4, name: "Nextcloud", description: "文件同步与个人云盘", category: "自建服务", icon: "nextcloud", url: "https://cloud.example.com", status: "online", responseMs: 55, checkedAt: checkedAt(3) },
  { id: 5, name: "Gitea", description: "轻量代码托管与协作", category: "自建服务", icon: "gitea", url: "https://git.example.com", status: "online", responseMs: 78, checkedAt: checkedAt(1) },
  { id: 6, name: "Home Assistant", description: "家中设备与自动化控制", category: "自建服务", icon: null, url: "https://home.example.com", status: "online", responseMs: 86, checkedAt: checkedAt(2) },
  { id: 7, name: "GitHub", description: "开源项目与代码协作", category: "开发工具", icon: "github", url: "https://github.com", status: "online", responseMs: 168, checkedAt: checkedAt(1) },
  { id: 8, name: "Cloudflare", description: "域名、网络与边缘服务", category: "开发工具", icon: "cloudflare", url: "https://dash.cloudflare.com", status: "online", responseMs: 116, checkedAt: checkedAt(2) },
  { id: 9, name: "Docker Hub", description: "容器镜像与开发资源", category: "开发工具", icon: "docker", url: "https://hub.docker.com", status: "online", responseMs: 82, checkedAt: checkedAt(1) },
  { id: 10, name: "开发文档", description: "常用技术参考与笔记", category: "开发工具", icon: null, url: "https://docs.example.com", status: "online", responseMs: 102, checkedAt: checkedAt(4) },
  { id: 11, name: "Emby", description: "家庭影音服务", category: "影音娱乐", icon: "emby", url: "https://media.example.com", status: "online", responseMs: 86, checkedAt: checkedAt(1) },
  { id: 12, name: "Jellyfin", description: "电影、剧集与家庭媒体库", category: "影音娱乐", icon: "jellyfin", url: "https://jellyfin.example.com", status: "online", responseMs: 94, checkedAt: checkedAt(1) },
  { id: 13, name: "YouTube", description: "视频与创作者频道", category: "影音娱乐", icon: "youtube", url: "https://www.youtube.com", status: "online", responseMs: 120, checkedAt: checkedAt(2) },
  { id: 14, name: "Spotify", description: "音乐与播客收藏", category: "影音娱乐", icon: "spotify", url: "https://open.spotify.com", status: "online", responseMs: 72, checkedAt: checkedAt(1) },
  { id: 15, name: "音乐库", description: "个人音乐收藏与播放", category: "影音娱乐", icon: null, url: "https://music.example.com", status: "offline", responseMs: null, checkedAt: checkedAt(8) },
  { id: 16, name: "在线笔记", description: "随时记录想法与待办", category: "实用工具", icon: null, url: "https://notes.example.com", status: "online", responseMs: 124, checkedAt: checkedAt(1) },
  { id: 17, name: "文件传送", description: "临时文件与分享链接", category: "实用工具", icon: null, url: "https://send.example.com", status: "online", responseMs: 152, checkedAt: checkedAt(2) },
  { id: 18, name: "工具箱", description: "编码、转换与日常小工具", category: "实用工具", icon: null, url: "https://tools.example.com", status: "unknown", responseMs: null, checkedAt: null },
]

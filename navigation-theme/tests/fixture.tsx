import { createRoot } from "react-dom/client"
import { NavigationPage } from "../src/App"
import { mockServices } from "../src/lib/mock-services"
import "../src/index.css"

// Browser-only fixtures. Not imported by the production entry point.
const variant = new URLSearchParams(location.search).get("fixture")
const services = variant === "empty" ? [] : variant === "icons" ? [
  { ...mockServices[0], icon: "https://icons.example.com/broken.png" },
  { ...mockServices[1], icon: "unknown-brand" },
  { ...mockServices[2], name: "长标题".repeat(30), description: "很长的服务描述".repeat(30), url: "javascript:alert(1)" },
  { ...mockServices[3], icon: "constructor" },
] : mockServices

createRoot(document.getElementById("root")!).render(<NavigationPage services={services} />)

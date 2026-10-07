import { useState } from "react"
import { createRoot } from "react-dom/client"
import { ServiceCard } from "../src/components/ServiceCard"
import { NodeCard } from "../src/components/NodeCard"
import "../src/index.css"

const legacyKeys = ["emby", "matrix", "simplex", "vaultwarden", "cloudflare", "jellyfin", "youtube", "spotify", "gitea", "docker", "nextcloud", "github", "unknown-brand", "constructor", "__proto__"]
const cases = [...legacyKeys.map(icon => ({ name: icon, icon })), { name: "Emby", icon: null }, { name: "YouTube", icon: "" },
  { name: "valid-url", icon: "https://icons.example.com/ok.svg" },
  { name: "broken-url", icon: "https://icons.example.com/broken.png" },
  { name: "insecure-url", icon: "http://icons.example.com/ok.svg" },
  { name: "credential-url", icon: "https://user:pass@icons.example.com/ok.svg" }]
const systems = ["Debian GNU/Linux", "Raspbian GNU/Linux", "Ubuntu", "Alpine Linux", "CentOS", "Rocky Linux", "AlmaLinux", "Red Hat Enterprise Linux", "Fedora", "Arch Linux", "openSUSE", "Other Linux"]
const nodeBase = { id: 1, name: "Node", country: "", online: false, last_seen: 0, metrics: null, os: "", arch: "x86_64", virt: "none", cpu_cores: 0, mem_total: 0, expires_at: null }
const now = Date.now()
const base = { description: "Description", category: "Category", url: "https://service.example.com/", status: "online", responseMs: 42, checkedAt: new Date(now).toISOString() }

function Fixture() {
  const [icon, setIcon] = useState("https://icons.example.com/broken.png")
  return <>
    {['standard', 'compact', 'minimal'].map(style => <section key={style} data-style={style}>
      {cases.map((item, id) => <ServiceCard key={id} service={{ ...base, ...item, id }} now={now} cardStyle={style} />)}
    </section>)}
    <section data-recovery>
      <button onClick={() => setIcon("https://icons.example.com/second.svg")}>Change icon URL</button>
      <ServiceCard service={{ ...base, id: 100, name: "Recovery", icon }} now={now} />
    </section>
    {systems.map(os => <section key={os} data-os={os}><NodeCard node={{ ...nodeBase, os }} onOpen={() => {}} /></section>)}
  </>
}
createRoot(document.getElementById("root")).render(<Fixture />)

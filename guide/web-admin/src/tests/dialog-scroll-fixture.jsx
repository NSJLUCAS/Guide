import { createRoot } from "react-dom/client"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogClose } from "../components/ui/dialog"
import "../index.css"

function Fixture() {
  return <main style={{ minHeight: "300vh", padding: 24 }}>
    <Dialog>
      <DialogTrigger>打开长表单</DialogTrigger>
      <DialogContent>
        <DialogTitle>长表单滚动回归</DialogTitle>
        <DialogDescription>使用实际 Guide Dialog，背景内容仅提供可滚动页面。</DialogDescription>
        <Dialog>
          <DialogTrigger>打开嵌套对话框</DialogTrigger>
          <DialogContent>
            <DialogTitle>嵌套对话框</DialogTitle>
            <DialogDescription>关闭后外层保持滚动锁。</DialogDescription>
            {Array.from({ length: 24 }, (_, i) => <label key={i}>嵌套字段 {i}<input aria-label={`嵌套字段 ${i}`} /></label>)}
            <DialogClose>返回外层</DialogClose>
          </DialogContent>
        </Dialog>
        {Array.from({ length: 30 }, (_, i) => <label key={i}>长字段 {i}<input aria-label={`长字段 ${i}`} /></label>)}
        <DialogClose>关闭表单</DialogClose>
      </DialogContent>
    </Dialog>
    <p>背景滚动恢复验证</p>
  </main>
}
createRoot(document.getElementById("root")).render(<Fixture />)

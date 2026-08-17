import { Bold, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Underline } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export default function RichTextEditor({ value, onChange, onUploadImage }: { value: string; onChange: (value: string) => void; onUploadImage?: (file: File) => Promise<string> }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, [value]);
  const apply = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    runCommand(command, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  };
  const addLink = () => {
    const url = window.prompt("أدخل رابطًا يبدأ بـ https:// أو mailto:");
    if (url?.trim()) apply("createLink", url.trim());
  };
  const handleImage = async (file?: File) => {
    if (!file || !onUploadImage) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { window.alert("استخدم صورة PNG أو JPEG أو WebP."); return; }
    if (file.size > 5 * 1024 * 1024) { window.alert("حجم الصورة يجب ألا يتجاوز 5 ميجابايت."); return; }
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      editorRef.current?.focus();
      runCommand("insertImage", url);
      onChange(editorRef.current?.innerHTML ?? "");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  return <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2" dir="rtl"><Button type="button" variant="ghost" size="icon" aria-label="غامق" onMouseDown={event => event.preventDefault()} onClick={() => apply("bold")}><Bold className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="مائل" onMouseDown={event => event.preventDefault()} onClick={() => apply("italic")}><Italic className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="تحته خط" onMouseDown={event => event.preventDefault()} onClick={() => apply("underline")}><Underline className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="قائمة نقطية" onMouseDown={event => event.preventDefault()} onClick={() => apply("insertUnorderedList")}><List className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="قائمة مرقمة" onMouseDown={event => event.preventDefault()} onClick={() => apply("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="إضافة رابط" onMouseDown={event => event.preventDefault()} onClick={addLink}><LinkIcon className="h-4 w-4" /></Button>{onUploadImage ? <><Button type="button" variant="ghost" size="icon" aria-label="إدراج صورة" disabled={isUploading} onMouseDown={event => event.preventDefault()} onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4" /></Button><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => void handleImage(event.target.files?.[0])} /></> : null}</div><div ref={editorRef} contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning onInput={event => onChange(event.currentTarget.innerHTML)} className="min-h-36 p-3 text-sm leading-8 outline-none" /> </div>;
}

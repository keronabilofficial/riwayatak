import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Underline } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "./ui/button";

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, [value]);
  const apply = (command: string, value?: string) => {
    editorRef.current?.focus();
    runCommand(command, value);
    onChange(editorRef.current?.innerHTML ?? "");
  };
  const addLink = () => {
    const url = window.prompt("أدخل رابطًا يبدأ بـ https:// أو mailto:");
    if (url?.trim()) apply("createLink", url.trim());
  };
  return <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2" dir="rtl"><Button type="button" variant="ghost" size="icon" aria-label="غامق" onMouseDown={event => event.preventDefault()} onClick={() => apply("bold")}><Bold className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="مائل" onMouseDown={event => event.preventDefault()} onClick={() => apply("italic")}><Italic className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="تحته خط" onMouseDown={event => event.preventDefault()} onClick={() => apply("underline")}><Underline className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="قائمة نقطية" onMouseDown={event => event.preventDefault()} onClick={() => apply("insertUnorderedList")}><List className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="قائمة مرقمة" onMouseDown={event => event.preventDefault()} onClick={() => apply("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="إضافة رابط" onMouseDown={event => event.preventDefault()} onClick={addLink}><LinkIcon className="h-4 w-4" /></Button></div><div ref={editorRef} contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning onInput={event => onChange(event.currentTarget.innerHTML)} className="min-h-36 p-3 text-sm leading-8 outline-none" /> </div>;
}

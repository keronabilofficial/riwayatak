import { Bold, Eraser, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Minus, Quote, Redo2, Underline, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Props = { value: string; onChange: (value: string) => void; onUploadImage?: (file: File) => Promise<string> };

function selectionInside(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;
  return element.contains(selection.anchorNode) && element.contains(selection.focusNode);
}

export default function RichTextEditor({ value, onChange, onUploadImage }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor || selectionInside(editor)) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount || !selectionInside(editor)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedRangeRef.current;
    if (!range) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const emit = useCallback(() => {
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const command = useCallback((name: string, commandValue?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(name, false, commandValue);
    emit();
  }, [emit, restoreSelection]);

  const addLink = () => {
    saveSelection();
    const url = window.prompt("أدخل رابطًا يبدأ بـ https:// أو mailto:");
    if (!url?.trim()) return;
    command("createLink", url.trim());
  };

  const handleImage = async (file?: File) => {
    if (!file || !onUploadImage) return;
    saveSelection();
    if (!IMAGE_TYPES.includes(file.type)) { window.alert("استخدم صورة PNG أو JPEG أو WebP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { window.alert("حجم الصورة يجب ألا يتجاوز 5 ميجابايت."); return; }
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand("insertImage", false, url);
      emit();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return <div className="overflow-hidden rounded-xl border border-border bg-card" dir="rtl">
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2" onMouseDown={event => { if ((event.target as HTMLElement).closest("button")) { event.preventDefault(); saveSelection(); } }}>
      <Select onValueChange={value => command("formatBlock", value)}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="نمط النص" /></SelectTrigger><SelectContent><SelectItem value="p">فقرة</SelectItem><SelectItem value="h2">عنوان كبير</SelectItem><SelectItem value="h3">عنوان فرعي</SelectItem><SelectItem value="blockquote">اقتباس</SelectItem></SelectContent></Select>
      <Button type="button" variant="ghost" size="icon" aria-label="تراجع" onClick={() => command("undo")}><Undo2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="إعادة" onClick={() => command("redo")}><Redo2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="غامق" onClick={() => command("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="مائل" onClick={() => command("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="تحته خط" onClick={() => command("underline")}><Underline className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="قائمة نقطية" onClick={() => command("insertUnorderedList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="قائمة مرقمة" onClick={() => command("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="اقتباس" onClick={() => command("formatBlock", "blockquote")}><Quote className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="خط فاصل" onClick={() => command("insertHorizontalRule")}><Minus className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="إضافة رابط" onClick={addLink}><LinkIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="مسح التنسيق" onClick={() => command("removeFormat")}><Eraser className="h-4 w-4" /></Button>
      {onUploadImage ? <><Button type="button" variant="ghost" size="icon" aria-label="إدراج صورة" disabled={isUploading} onClick={() => { saveSelection(); fileInputRef.current?.click(); }}><ImagePlus className="h-4 w-4" /></Button><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => void handleImage(event.target.files?.[0])} /></> : null}
    </div>
    <div ref={editorRef} contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning onFocus={saveSelection} onKeyUp={saveSelection} onMouseUp={saveSelection} onInput={emit} className="min-h-44 p-4 text-sm leading-8 outline-none empty:before:text-muted-foreground empty:before:content-['اكتب_محتوى_القسم_هنا...']" />
  </div>;
}

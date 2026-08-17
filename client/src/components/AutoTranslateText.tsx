import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const ignoredTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE"]);

function isTranslatableNode(node: Text) {
  const value = node.nodeValue?.trim() ?? "";
  const parent = node.parentElement;
  if (!parent || ignoredTags.has(parent.tagName) || parent.closest("[data-no-auto-translate], [contenteditable=\"true\"]")) return false;
  if (value.length < 2 || /^([\d\s.,:%/+-]|[•·—–])+$/.test(value)) return false;
  return /[\u0600-\u06ff]/.test(value);
}

export default function AutoTranslateText() {
  const { language } = useLanguage();
  const { mutate } = trpc.language.autoTranslate.useMutation();
  const originals = useRef(new WeakMap<Text, string>());
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (language === "ar") return;
    const root = document.body;
    let observer: MutationObserver;
    let stopped = false;

    const restoreAndCollect = () => {
      const nodes: Text[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const textNode = current as Text;
        const original = originals.current.get(textNode);
        if (original && textNode.nodeValue !== original) textNode.nodeValue = original;
        if (isTranslatableNode(textNode)) {
          const source = textNode.nodeValue?.trim() ?? "";
          originals.current.set(textNode, source);
          nodes.push(textNode);
        }
      }
      return nodes;
    };

    const translateVisibleText = () => {
      if (stopped) return;
      observer.disconnect();
      const nodes = restoreAndCollect();
      const unique = Array.from(new Set(nodes.map(node => node.nodeValue?.trim()).filter((value): value is string => Boolean(value))));
      if (!unique.length) { observer.observe(root, { subtree: true, childList: true, characterData: true }); return; }
      mutate({ targetLanguage: language, texts: unique.slice(0, 24) }, {
        onSuccess: result => {
          if (stopped) return;
          const translations = new Map(result.translations.map(item => [item.source, item.translated]));
          for (const node of nodes) {
            const source = originals.current.get(node);
            const translated = source ? translations.get(source) : undefined;
            if (translated && node.nodeValue?.trim() === source) node.nodeValue = translated;
          }
          observer.observe(root, { subtree: true, childList: true, characterData: true });
        },
        onError: () => observer.observe(root, { subtree: true, childList: true, characterData: true }),
      });
    };

    const schedule = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(translateVisibleText, 250);
    };
    observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, childList: true, characterData: true });
    schedule();
    return () => {
      stopped = true;
      if (timer.current) window.clearTimeout(timer.current);
      observer.disconnect();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const original = originals.current.get(current as Text);
        if (original) current.nodeValue = original;
      }
    };
  }, [language, mutate]);

  return null;
}

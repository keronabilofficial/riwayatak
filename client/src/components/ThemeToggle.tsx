import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ compact = true }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي";
  return <Button variant="ghost" size={compact ? "icon" : "sm"} className="rounded-full" onClick={toggleTheme} aria-label={label} title={label}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{!compact && <span className="mr-2">{theme === "dark" ? "نهاري" : "ليلي"}</span>}</Button>;
}

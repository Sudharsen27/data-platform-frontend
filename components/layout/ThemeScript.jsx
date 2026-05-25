import { THEME_STORAGE_KEY } from "@/context/ThemeContext";

/** Runs before paint to avoid light flash when dark mode is saved. */
export default function ThemeScript() {
  const key = THEME_STORAGE_KEY;
  const script = `(function(){try{var d=localStorage.getItem(${JSON.stringify(key)})==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

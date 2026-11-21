import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("cruxcoach-theme", next);
    } catch {
      // Theme still applies for this visit when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title="Toggle theme"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2.5a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Zm0-19a1 1 0 0 1 1 1V3a1 1 0 1 1-2 0V1.5a1 1 0 0 1 1-1ZM22 11a1 1 0 0 1 1 1 1 1 0 0 1-1 1h-1.5a1 1 0 1 1 0-2H22ZM3.5 11a1 1 0 1 1 0 2H2a1 1 0 1 1 0-2h1.5Zm15.9-7.4a1 1 0 0 1 0 1.4l-1 1.1a1 1 0 1 1-1.5-1.4l1.1-1.1a1 1 0 0 1 1.4 0ZM6.1 17.9a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4-1.4l1.1-1.1a1 1 0 0 1 1.4 0Zm13.3 2.5a1 1 0 0 1-1.4 1.4l-1.1-1.1a1 1 0 0 1 1.4-1.4l1.1 1.1ZM6.1 6.1a1 1 0 0 1-1.4 1.4L3.6 6.4A1 1 0 0 1 5 5l1.1 1.1Z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.3 14.6A9.5 9.5 0 0 1 9.4 2.7a1 1 0 0 0-1.2-1.3A10.5 10.5 0 1 0 22.6 15.8a1 1 0 0 0-1.3-1.2Z"
          />
        </svg>
      )}
    </button>
  );
}

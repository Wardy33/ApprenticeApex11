import { ReactNode, useEffect } from "react";
import { WebHeaderNew } from "./WebHeaderNew";
import { WebFooter } from "./WebFooter";

interface WebLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function WebLayout({
  children,
  className = "",
  showHeader = true,
  showFooter = true,
}: WebLayoutProps) {
  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-user");
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove("keyboard-user");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col">
      {/* Skip Links for Screen Readers */}
      <a
        href="#main-content"
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="skip-link"
        aria-label="Skip to navigation"
      >
        Skip to navigation
      </a>

      {showHeader && (
        <header role="banner" id="navigation">
          <WebHeaderNew />
        </header>
      )}

      <main
        id="main-content"
        role="main"
        className={`flex-1 ${className}`}
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>

      {showFooter && (
        <footer role="contentinfo">
          <WebFooter />
        </footer>
      )}

      {/* Live region for dynamic content announcements */}
      <div
        id="live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      ></div>
    </div>
  );
}

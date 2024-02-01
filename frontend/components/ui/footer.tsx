"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = useState(2024);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Hide footer on deck page
  if (pathname === "/deck") return null;

  const sections = {
    main: [
      { label: "Blog", href: "https://ava-portfolio-manager-ai-agent.vercel.app/blog" },
      { label: "Whitepaper", href: "https://ava-portfolio-manager-ai-agent.vercel.app/whitepaper" },
    ],
    legal: [
      { label: "Terms of Service", href: "https://ava-portfolio-manager-ai-agent.vercel.app/terms" },
      { label: "Privacy Policy", href: "https://ava-portfolio-manager-ai-agent.vercel.app/privacy" },
    ],
    social: [
      { label: "X (Twitter)", href: "https://x.com/0xkamal7" },
      { label: "Telegram", href: "https://t.me/kamalthedev" },
    ],
  };

  return (
    <>
      {/* Spacer div to prevent content overlap */}
      <div className="" />

      <footer className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            <div className="text-sm text-gray-400">
              © {currentYear} Ava the AI Agent
            </div>
            <div className="flex items-center space-x-4">
              {sections.social.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
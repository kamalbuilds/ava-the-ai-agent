"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
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
      { label: "Docs", href: "https://ava-portfolio-manager-ai-agent.vercel.app/docs" },
    ],
    legal: [
      { label: "Privacy", href: "https://ava-portfolio-manager-ai-agent.vercel.app/privacy" },
      { label: "Terms", href: "https://ava-portfolio-manager-ai-agent.vercel.app/terms" },
    ],
    social: [
      { label: "Twitter", href: "https://twitter.com" },
      { label: "Discord", href: "https://discord.com" },
      { label: "Telegram", href: "https://telegram.org" },
    ],
  };

  return (
    <>
      <div className="" />

      <footer className={cn("relative w-full bg-black/20 backdrop-blur-md border-t border-white/10", className)}>
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">© {currentYear} Ava AI</span>
              <div className="hidden md:flex space-x-4">
                {sections.main.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {sections.social.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
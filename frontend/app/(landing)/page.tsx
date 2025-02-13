"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white">
      <div className="max-w-4xl text-center px-4">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Welcome to AVA
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Your AI-powered assistant for seamless task automation and intelligent interactions
        </p>
        <Link href="/app">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 rounded-lg text-xl font-semibold transition-all duration-200 transform hover:scale-105">
            Launch App
          </Button>
        </Link>
      </div>
    </div>
  );
}

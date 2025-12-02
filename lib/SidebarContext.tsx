"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Save dark mode preference and update DOM
  const toggleDarkMode = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    // Add transition class for smooth theme switching
    document.documentElement.style.transition =
      "background-color 0.2s ease, color 0.2s ease";

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Remove transition after animation completes
    setTimeout(() => {
      document.documentElement.style.transition = "";
    }, 200);
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isMobile,
        isDarkMode,
        setIsDarkMode: toggleDarkMode,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

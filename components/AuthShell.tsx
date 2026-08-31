
import { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  subtitle?: string;
  title: string;
  logo?: string | null;
  size?: "sm" | "md" | "lg";
}

export function AuthShell({
  children,
  subtitle,
  title,
  logo,
  size = "sm",
}: AuthShellProps) {
  const width =
    size === "lg" ? "max-w-6xl" : size === "md" ? "max-w-4xl" : "max-w-md";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 relative"
      style={{ backgroundImage: "url('images/hero-1.webp')" }}
    >
      <div className="absolute inset-0 bg-black/60"></div>

      <div
        className={`relative z-10 w-full ${width} bg-white/10 backdrop-blur-xl rounded-3xl p-8`}
      >
        {/* 🔥 LOGO (NO CONDITIONS, DIRECT RENDER) */}
        {logo && (
          <img
            src={logo}
            alt="Institute Logo"
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/40 p-2 object-contain"
          />
        )}

        <h2 className="text-center text-white text-2xl mb-6 font-bold ">
          {title}
        </h2>

        {subtitle && (
          <p className="text-center text-white/80 text-sm mb-6">
            ({subtitle})
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

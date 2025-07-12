"use client";
import { getCollection } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextProps {
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Cerrar sesión y limpiar localStorage
  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUser(null);
    showToast.error("Tu sesión ha sido cerrada automáticamente porque tu check-in fue desactivado.");
    router.push("/login");
  };

  // Verifica autenticación al cargar
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    const userData = localStorage.getItem("userData");
    setIsAuthenticated(isAuth);
    setUser(userData ? JSON.parse(userData) : null);
  }, []);

  // Protección de rutas
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuth && pathname !== "/login") {
      router.replace("/login");
    } else if (isAuth && pathname === "/login") {
      router.replace("/");
    }
  }, [isAuthenticated, pathname, router]);

  // Suscripción a cambios de check_in en Firebase
  useEffect(() => {
    if (!user?.email) return;
    let interval: NodeJS.Timeout;
    const checkCheckIn = async () => {
      type Trabajador = { id: string; email?: string; check_in?: boolean };
      const trabajadores: Trabajador[] = await getCollection("trabajadores");
      const trabajador = trabajadores.find((t) => t.email === user.email);
      if (trabajador && trabajador.check_in === false) {
        logout();
      }
    };
    interval = setInterval(checkCheckIn, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};

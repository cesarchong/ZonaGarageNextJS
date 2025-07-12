"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollection, signIn } from "@/lib/firebase";
import { showToast } from "nextjs-toast-notify";
import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signIn({ email, password });
      const trabajadores = await getCollection("trabajadores");
      const trabajador = trabajadores.find((t: any) => t.email === email) as { rol?: string, check_in?: boolean } | undefined;
      if (trabajador) {
        if (trabajador.check_in) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userEmail", email);
          localStorage.setItem("userRole", trabajador.rol || "empleado");
          localStorage.setItem("loginTime", new Date().toISOString());
          localStorage.setItem("userData", JSON.stringify(trabajador));
          showToast.success(`Inicio de sesión exitoso (${trabajador.rol || "empleado"})`);
          window.location.href = "/";
        } else {
          showToast.error("Debes hacer check-in antes de poder acceder al sistema.");
        }
      } else {
        showToast.error("No se encontró el usuario en la base de datos de empleados.");
      }
    } catch (error: any) {
      let msg = "Email o contraseña incorrectos";
      if (error.code === "auth/user-not-found") {
        msg = "El usuario no existe";
      } else if (error.code === "auth/wrong-password") {
        msg = "Contraseña incorrecta";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Demasiados intentos. Intenta más tarde.";
      }
      showToast.error(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
        }}
      ></div>
      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-black text-yellow-400 p-4 rounded-full">
              <i className="fas fa-car-side text-3xl"></i>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Zona Garaje</CardTitle>
          <p className="text-gray-600">Sistema de Gestión</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Ingrese su email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-yellow-400 hover:bg-gray-800 py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">© 2023 Zona Garaje. Autolavado & Accesorios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

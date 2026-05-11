import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { getDefaultRouteForRoles } from "../domain/roleNavigation";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import iceStarFullLogo from "../components/icons/icestar.png";

const schema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const platformHighlights = [
  "Control operativo en tiempo real",
  "Trazabilidad por usuario y estado",
  "Gestión segura de accesos",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginError = useMemo(() => {
    const error = loginMutation.error;
    if (!error) return null;
    return (
      error?.response?.data?.message ||
      error?.message ||
      "No fue posible iniciar sesión. Verifica tus credenciales."
    );
  }, [loginMutation.error]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await loginMutation.mutateAsync(values);
      navigate(getDefaultRouteForRoles(session.user?.roles || []), { replace: true });
    } catch {
      // Error handled via loginMutation.error and rendered in UI.
    }
  });

  return (
    <main className="relative h-screen overflow-hidden bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left panel - Branding (sin scroll) */}
      <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 via-white to-neutral-50 px-12 py-8 lg:flex">
        <div className="flex-1">
          <div className="mt-8 max-w-2xl">
            <p className="mb-5 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              Muelles V4
            </p>
            <h1 className="text-4xl font-black tracking-tight text-neutral-800 lg:text-5xl">
              Gestión en tiempo real de operación logística
            </h1>
            <div className="mt-10 grid gap-4">
              {platformHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-success-100 text-sm font-bold text-success-700">
                    ✓
                  </span>
                  <span className="text-sm font-medium text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-neutral-800">24/7</p>
            <p className="mt-1 text-xs text-neutral-500">Monitoreo de operación</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-neutral-800">RBAC</p>
            <p className="mt-1 text-xs text-neutral-500">Acceso por usuario/rol</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-neutral-800">SQL</p>
            <p className="mt-1 text-xs text-neutral-500">Datos centralizados</p>
          </div>
        </div>
      </section>

      {/* Right panel - Login (sin scroll) */}
      <section className="relative flex h-full items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <img
              src={iceStarFullLogo}
              alt="IceStar"
              className="mx-auto mb-4 h-12 w-auto object-contain"
            />
            <p className="text-xl font-black text-neutral-800">Muelles V4</p>
          </div>

          <Card className="w-full border border-neutral-200 shadow-lg shadow-neutral-200/50">
            <div className="mb-6">
              <p className="text-sm text-neutral-600">
                Accede con tu usuario y contraseña para continuar al panel de control.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                {loginError}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <Input
                label="Correo electrónico"
                required
                type="email"
                autoComplete="email"
                placeholder="usuario@icestarlatam.com"
                {...register("email")}
                error={errors.email?.message}
              />

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    label="Contraseña"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-[2.35rem] rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                  />
                  Recordar sesión
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending || !isValid}
              >
                {loginMutation.isPending ? "Validando acceso..." : "Iniciar sesión"}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} Excelencia Operacional. Todos los derechos reservados.
          </p>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-lg border border-ms-border bg-white p-8 shadow-sm"
    >
      <h1 className="mb-1 text-2xl font-extrabold text-ms-primary">M&amp;S Care</h1>
      <p className="mb-6 text-sm text-ms-text-soft">Espace administration</p>
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-ms-text">Email</span>
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] outline-none focus:border-ms-accent"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-ms-text">
            Mot de passe
          </span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="h-11 w-full rounded-md border border-ms-accent/24 pr-11 pl-3 text-[15px] outline-none focus:border-ms-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ms-text-muted transition hover:text-ms-primary"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {showPassword ? (
                  <>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="m2 2 20 20" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </label>
        {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 rounded-full bg-ms-accent text-[15px] font-semibold text-white transition hover:bg-ms-primary disabled:opacity-60"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </form>
  );
}

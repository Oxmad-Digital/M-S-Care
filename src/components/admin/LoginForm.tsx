"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, undefined);

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
          <input
            name="password"
            type="password"
            required
            className="h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] outline-none focus:border-ms-accent"
          />
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

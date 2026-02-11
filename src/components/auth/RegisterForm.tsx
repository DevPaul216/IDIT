"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      console.log("Registration result:", result);

      if (result.error) {
        // Show detailed error
        const errorMsg = result.error.message || result.error.code || JSON.stringify(result.error);
        setError(`Registrierung fehlgeschlagen: ${errorMsg}`);
        console.error("Registration error:", result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Registration exception:", err);
      setError(`Error: ${err?.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <Input
        id="name"
        type="text"
        label="Name"
        placeholder="Max Mustermann"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="name"
      />

      <Input
        id="email"
        type="email"
        label="E-Mail"
        placeholder="name@beispiel.de"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        id="password"
        type="password"
        label="Passwort"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      <Input
        id="confirmPassword"
        type="password"
        label="Passwort bestätigen"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Konto wird erstellt..." : "Konto erstellen"}
      </Button>
    </form>
  );
}

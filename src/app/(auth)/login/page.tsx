import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
        In Ihrem Konto anmelden
      </h2>
      
      <LoginForm />
      
      <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Noch kein Konto?{" "}
        <Link href="/register" className="text-blue-500 hover:underline font-medium">
          Registrieren
        </Link>
      </div>
    </>
  );
}

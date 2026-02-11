import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
        Konto erstellen
      </h2>
      
      <RegisterForm />
      
      <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Bereits ein Konto?{" "}
        <Link href="/login" className="text-blue-500 hover:underline font-medium">
          Anmelden
        </Link>
      </div>
    </>
  );
}

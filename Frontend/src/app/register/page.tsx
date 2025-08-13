// Registration page. Handles user registration and automatic login after signup.
"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import RegisterContent from "@/components/RegisterContent";

export default function RegisterPage() {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <RegisterContent />
      </Suspense>
    </AuthProvider>
  );
}

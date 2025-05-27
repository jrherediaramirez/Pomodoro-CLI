// app/layout.tsx - Updated with AuthProvider
import "../styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "Pomodoro CLI",
  description: "A terminal-based Pomodoro timer with Firebase authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

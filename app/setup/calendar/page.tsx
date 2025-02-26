"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CalendarSetup() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    if (isSkipped) {
      router.push("/dashboard");
    }
  }, [isSkipped, router]);

  const handleCalendarConnect = async (provider: "google" | "azure-ad") => {
    try {
      await signIn(provider, {
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Error connecting calendar:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Connect Your Calendar</h2>
          <p className="mt-2 text-gray-600">
            Connect your calendar to get started with SlashPad
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleCalendarConnect("google")}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Connect Google Calendar
          </button>

          <button
            onClick={() => handleCalendarConnect("azure-ad")}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50"
          >
            <img
              src="https://www.microsoft.com/favicon.ico"
              alt="Microsoft"
              className="w-5 h-5"
            />
            Connect Outlook Calendar
          </button>

          <button
            onClick={() => setIsSkipped(true)}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
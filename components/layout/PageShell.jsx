"use client";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

/**
 * Standard authenticated layout: responsive sidebar + navbar + constrained main.
 */
export default function PageShell({ title, children, mainClassName = "" }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:min-h-screen">
          <Navbar title={title} />
          <main
            className={`flex-1 space-y-6 p-4 pb-28 sm:p-6 md:pb-6 lg:mx-auto lg:w-full lg:max-w-[1600px] ${mainClassName}`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

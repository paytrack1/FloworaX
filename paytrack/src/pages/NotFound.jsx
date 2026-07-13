import React from "react";

const NotFound = () => (
  <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center px-6 text-center">
    <p className="text-7xl font-black text-[#185FA5]">404</p>
    <h1 className="text-2xl font-black text-[#0F172A] mt-4">Page not found</h1>
    <p className="text-sm text-[#64748B] mt-2 max-w-sm">
      The page you are looking for does not exist or may have moved.
    </p>
    <a
      href="/"
      className="mt-6 bg-[#185FA5] text-white px-6 py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
    >
      Back to Home
    </a>
  </div>
);

export default NotFound;

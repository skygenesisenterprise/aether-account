"use client";

export function Footer() {
  return (
    <footer className="mt-auto flex justify-center bg-background px-8 py-4 w-full">
      <div className="max-w-2xl flex flex-col gap-1">
        <p className="text-xs text-muted-foreground text-center">
          Your activity is private and visible only to you. Make sure to review your preferences for all Sky Genesis Enterprise services.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Sky Genesis Enterprise is committed to keeping your data secure and respecting your privacy.{" "}
          <button className="text-[#1a73e8] hover:underline">Learn more</button>
        </p>
      </div>
    </footer>
  );
}
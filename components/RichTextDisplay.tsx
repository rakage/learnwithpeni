"use client";

import { useEffect, useRef } from "react";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export default function RichTextDisplay({
  content,
  className = "",
}: RichTextDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Find all links in the content and make them open in new tabs
      const links = contentRef.current.querySelectorAll("a");
      links.forEach((link) => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");

        // Add some styling to make links more visible
        link.style.color = "#2563eb";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";

        // Add hover effect
        link.addEventListener("mouseenter", () => {
          link.style.color = "#1d4ed8";
        });

        link.addEventListener("mouseleave", () => {
          link.style.color = "#2563eb";
        });
      });
    }
  }, [content]);

  return (
    <div className={`rich-text-display ${className}`}>
      <div
        ref={contentRef}
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Custom styles for the display */}
      <style jsx global>{`
        .rich-text-display .prose {
          color: #374151;
          line-height: 1.6;
        }

        .rich-text-display .prose h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #111827;
        }

        .rich-text-display .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }

        .rich-text-display .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }

        .rich-text-display .prose p {
          margin-bottom: 1rem;
        }

        .rich-text-display .prose strong {
          font-weight: 600;
          color: #111827;
        }

        .rich-text-display .prose em {
          font-style: italic;
        }

        .rich-text-display .prose u {
          text-decoration: underline;
        }

        .rich-text-display .prose s {
          text-decoration: line-through;
        }

        .rich-text-display .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .rich-text-display .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .rich-text-display .prose li {
          margin-bottom: 0.25rem;
        }

        .rich-text-display .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }

        .rich-text-display .prose code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: "Courier New", monospace;
          font-size: 0.875rem;
        }

        .rich-text-display .prose pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .rich-text-display .prose pre code {
          background-color: transparent;
          padding: 0;
        }

        .rich-text-display .prose a {
          color: #2563eb !important;
          text-decoration: underline !important;
          transition: color 0.2s ease;
        }

        .rich-text-display .prose a:hover {
          color: #1d4ed8 !important;
        }

        /* Text alignment classes */
        .rich-text-display .ql-align-center {
          text-align: center;
        }

        .rich-text-display .ql-align-right {
          text-align: right;
        }

        .rich-text-display .ql-align-justify {
          text-align: justify;
        }

        /* Indentation classes */
        .rich-text-display .ql-indent-1 {
          padding-left: 2rem;
        }

        .rich-text-display .ql-indent-2 {
          padding-left: 4rem;
        }

        .rich-text-display .ql-indent-3 {
          padding-left: 6rem;
        }
      `}</style>
    </div>
  );
}

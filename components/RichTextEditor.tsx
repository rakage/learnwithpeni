"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
  ),
});

// Import Quill CSS
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your content here...",
  className = "",
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Custom toolbar configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "blockquote", "code-block"],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  // Allowed formats
  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "blockquote",
    "code-block",
  ];

  if (!mounted) {
    return (
      <div className="h-32 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{
          backgroundColor: "white",
        }}
      />

      {/* Custom styles for the editor */}
      <style jsx global>{`
        .rich-text-editor .ql-editor {
          min-height: 150px;
          font-size: 14px;
          line-height: 1.5;
        }

        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-bottom: none;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }

        .rich-text-editor .ql-container {
          border-bottom: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-top: none;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }

        .rich-text-editor .ql-editor:focus {
          outline: none;
        }

        .rich-text-editor .ql-container.ql-snow {
          border: 1px solid #e5e7eb;
          border-top: none;
        }

        .rich-text-editor .ql-toolbar.ql-snow {
          border: 1px solid #e5e7eb;
          border-bottom: none;
        }

        /* Style for links in the editor */
        .rich-text-editor .ql-editor a {
          color: #2563eb;
          text-decoration: underline;
        }

        .rich-text-editor .ql-editor a:hover {
          color: #1d4ed8;
        }

        /* Ensure proper focus styles */
        .rich-text-editor .ql-container.ql-snow:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .rich-text-editor .ql-toolbar.ql-snow:focus-within {
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

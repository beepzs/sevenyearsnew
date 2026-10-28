import React, { useState, useRef, useEffect, useCallback } from "react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  rows?: number;
  label?: string;
  helperText?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Write content here...",
  minHeight = 160,
  rows,
  label,
  helperText,
  className = "",
  style,
}) => {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef<boolean>(false);

  // Compute calculated min-height based on rows prop if provided
  const computedMinHeight = rows ? `${Math.max(rows * 28, 120)}px` : typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  // Sync external value to visual editor when it changes from outside
  useEffect(() => {
    if (editorRef.current && mode === "visual") {
      if (!isInternalChange.current) {
        if (editorRef.current.innerHTML !== value) {
          editorRef.current.innerHTML = value || "";
        }
      }
      isInternalChange.current = false;
    }
  }, [value, mode]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      // Convert single empty <br> or empty paragraph to empty string
      const cleanHtml = html === "<p><br></p>" || html === "<br>" ? "" : html;
      onChange(cleanHtml);
    }
  }, [onChange]);

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (mode !== "visual") return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInsertLink = () => {
    const url = prompt("Enter web link or URL (e.g. https://... or /answers/slug):", "https://");
    if (url && url.trim()) {
      executeCommand("createLink", url.trim());
    }
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand("formatBlock", tag ? `<${tag}>` : "<p>");
  };

  // Word count & Char count calculations
  const textOnly = value ? value.replace(/<[^>]*>/g, "").trim() : "";
  const charCount = textOnly.length;
  const wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className={`rte-container ${className}`}
      style={{
        border: "1px solid rgba(227, 220, 209, 0.9)",
        borderRadius: "10px",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...style,
      }}
    >
      {/* 1. TOP TOOLBAR */}
      <div
        className="rte-toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.5rem 0.75rem",
          background: "rgba(251, 249, 245, 0.85)",
          borderBottom: "1px solid rgba(227, 220, 209, 0.7)",
          userSelect: "none",
        }}
      >
        {/* Undo / Redo */}
        <div style={{ display: "inline-flex", gap: "2px", marginRight: "4px" }}>
          <button
            type="button"
            className="rte-btn"
            title="Undo (Ctrl+Z)"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("undo")}
          >
            ↶
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Redo (Ctrl+Y)"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("redo")}
          >
            ↷
          </button>
        </div>

        <div className="rte-sep" />

        {/* Headings Selector */}
        <select
          className="rte-select"
          disabled={mode !== "visual"}
          onChange={(e) => {
            handleFormatBlock(e.target.value);
            e.target.value = "";
          }}
          defaultValue=""
          title="Text Style & Headings"
        >
          <option value="" disabled>
            Paragraph style…
          </option>
          <option value="p">Normal Paragraph</option>
          <option value="h2">Heading 2 (Section Title)</option>
          <option value="h3">Heading 3 (Subsection)</option>
          <option value="h4">Heading 4 (Minor Heading)</option>
          <option value="blockquote">Blockquote (Quote Callout)</option>
          <option value="pre">Code / Monospace Block</option>
        </select>

        <div className="rte-sep" />

        {/* Text Formats */}
        <div style={{ display: "inline-flex", gap: "2px" }}>
          <button
            type="button"
            className="rte-btn"
            title="Bold (Ctrl+B)"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("bold")}
            style={{ fontWeight: 800 }}
          >
            B
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Italic (Ctrl+I)"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("italic")}
            style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}
          >
            I
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Underline (Ctrl+U)"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("underline")}
            style={{ textDecoration: "underline" }}
          >
            U
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Strikethrough"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("strikeThrough")}
            style={{ textDecoration: "line-through" }}
          >
            S
          </button>
        </div>

        <div className="rte-sep" />

        {/* Lists & Alignment */}
        <div style={{ display: "inline-flex", gap: "2px" }}>
          <button
            type="button"
            className="rte-btn"
            title="Bulleted List"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("insertUnorderedList")}
          >
            • List
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Numbered List"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("insertOrderedList")}
          >
            1. List
          </button>
        </div>

        <div className="rte-sep" />

        {/* Alignment */}
        <div style={{ display: "inline-flex", gap: "2px" }}>
          <button
            type="button"
            className="rte-btn"
            title="Align Left"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("justifyLeft")}
          >
            ⇤
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Align Center"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("justifyCenter")}
          >
            ≡
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Align Right"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("justifyRight")}
          >
            ⇥
          </button>
        </div>

        <div className="rte-sep" />

        {/* Inserts & Cleanup */}
        <div style={{ display: "inline-flex", gap: "2px" }}>
          <button
            type="button"
            className="rte-btn"
            title="Insert Link"
            disabled={mode !== "visual"}
            onClick={handleInsertLink}
          >
            🔗 Link
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Horizontal Divider"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("insertHorizontalRule")}
          >
            ― Divider
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Remove Formatting"
            disabled={mode !== "visual"}
            onClick={() => executeCommand("removeFormat")}
          >
            🧹 Clean
          </button>
        </div>

        {/* MODE SWITCHER (TABS) */}
        <div style={{ marginLeft: "auto", display: "inline-flex", gap: "2px", background: "var(--line-light, #ece6dc)", padding: "2px", borderRadius: "6px" }}>
          <button
            type="button"
            className={`rte-tab-btn ${mode === "visual" ? "is-active" : ""}`}
            onClick={() => setMode("visual")}
            title="Rich Visual Editor"
          >
            ✍️ Visual
          </button>
          <button
            type="button"
            className={`rte-tab-btn ${mode === "html" ? "is-active" : ""}`}
            onClick={() => setMode("html")}
            title="HTML Source Code"
          >
            &lt;/&gt; HTML
          </button>
          <button
            type="button"
            className={`rte-tab-btn ${mode === "preview" ? "is-active" : ""}`}
            onClick={() => setMode("preview")}
            title="Live Preview"
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {/* 2. MAIN EDITING CANVAS */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* VISUAL WYSIWYG CANVAS */}
        {mode === "visual" && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            data-placeholder={placeholder}
            className="rte-canvas"
            style={{
              minHeight: computedMinHeight,
              padding: "0.85rem 1rem",
              outline: "none",
              fontSize: "0.95rem",
              lineHeight: 1.65,
              color: "var(--ink, #1f2a3d)",
              fontFamily: "var(--font-text, inherit)",
              overflowY: "auto",
              flex: 1,
            }}
          />
        )}

        {/* RAW HTML SOURCE CODE EDITOR */}
        {mode === "html" && (
          <textarea
            className="form-control rte-raw-code"
            style={{
              width: "100%",
              minHeight: computedMinHeight,
              padding: "0.85rem 1rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.88rem",
              lineHeight: 1.5,
              color: "#1e293b",
              background: "#fafafa",
              border: "none",
              outline: "none",
              resize: "vertical",
              flex: 1,
            }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<div>Enter raw HTML code here...</div>"
          />
        )}

        {/* LIVE RENDERED PREVIEW */}
        {mode === "preview" && (
          <div
            className="rte-preview"
            style={{
              minHeight: computedMinHeight,
              padding: "1rem 1.25rem",
              background: "#ffffff",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "var(--ink, #1f2a3d)",
              overflowY: "auto",
              borderTop: "1px dashed var(--line)",
            }}
            dangerouslySetInnerHTML={{
              __html: value || `<p style="color:var(--ink-3);font-style:italic;">Nothing to preview yet.</p>`,
            }}
          />
        )}
      </div>

      {/* 3. STATUS BAR */}
      <div
        className="rte-footer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.35rem 0.75rem",
          background: "var(--cream, #fbf9f5)",
          borderTop: "1px solid var(--line, #e3dcd1)",
          fontSize: "0.78rem",
          color: "var(--ink-3, #758195)",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <span>
            Mode: <strong>{mode === "visual" ? "Visual WYSIWYG" : mode === "html" ? "HTML Source" : "Live Preview"}</strong>
          </span>
          {helperText && <span>• {helperText}</span>}
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
};

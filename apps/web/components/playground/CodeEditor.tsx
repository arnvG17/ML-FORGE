"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-muted">
      <span className="text-sm font-mono font-light text-muted">Loading editor...</span>
    </div>
  ),
});

interface CodeEditorProps {
  code: string;
}

export default function CodeEditor({ code }: CodeEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language="python"
      theme="forge-dark"
      value={code}
      options={{
        readOnly: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderWhitespace: "none",
        lineNumbers: "on",
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        padding: { top: 16, bottom: 16 },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        overviewRulerLanes: 0,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("forge-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": "#000000",
            "editor.foreground": "#FFFFFF",
            "editorLineNumber.foreground": "#444444",
            "editorLineNumber.activeForeground": "#888888",
            "editor.selectionBackground": "#222222",
            "editor.lineHighlightBackground": "#111111",
            "editorCursor.foreground": "#FFFFFF",
            "editorWidget.background": "#111111",
            "editorWidget.border": "#222222",
          },
        });
      }}
    />
  );
}

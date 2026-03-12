interface OutputPanelProps {
  stdout?: string;
  stderr?: string;
  errors?: string[];
}

export default function OutputPanel({ stdout, stderr, errors }: OutputPanelProps) {
  const hasContent = stdout || stderr || (errors && errors.length > 0);

  if (!hasContent) return null;

  return (
    <div className="border-t border-border p-4">
      {errors && errors.length > 0 && (
        <div className="mb-3">
          {errors.map((err, i) => (
            <div
              key={i}
              className="text-xs font-mono text-white bg-elevated border border-border p-3 mb-2"
            >
              {err}
            </div>
          ))}
        </div>
      )}
      {stdout && (
        <pre className="text-xs font-mono text-placeholder whitespace-pre-wrap break-words">
          {stdout}
        </pre>
      )}
      {stderr && (
        <pre className="text-xs font-mono text-muted whitespace-pre-wrap break-words mt-2">
          {stderr}
        </pre>
      )}
    </div>
  );
}

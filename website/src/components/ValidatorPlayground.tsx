import { useState } from "preact/hooks";
import Ajv from "ajv";
import addFormats from "ajv-formats";

interface Example {
  label: string;
  json: string;
}

interface Props {
  schema: Record<string, unknown>;
  examples: Example[];
}

interface ValidationError {
  path: string;
  message: string;
}

export default function ValidatorPlayground({ schema, examples }: Props) {
  const [input, setInput] = useState(examples[0]?.json || "");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function validate() {
    setParseError(null);
    setErrors([]);
    setIsValid(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validateFn = ajv.compile(schema);
    const valid = validateFn(parsed);

    if (valid) {
      setIsValid(true);
      setErrors([]);
    } else {
      setIsValid(false);
      setErrors(
        (validateFn.errors || []).map((err) => ({
          path: err.instancePath || "/",
          message: err.message || "Unknown error",
        }))
      );
    }
  }

  function loadExample(json: string) {
    setInput(json);
    setIsValid(null);
    setErrors([]);
    setParseError(null);
  }

  return (
    <div>
      {/* Example buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {examples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => loadExample(ex.json)}
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Load: {ex.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={input}
        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        rows={18}
        style={{
          width: "100%",
          fontFamily: "ui-monospace, monospace",
          fontSize: "13px",
          lineHeight: "1.5",
          padding: "12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          background: "#f9fafb",
          color: "#111827",
          resize: "vertical",
        }}
        spellcheck={false}
      />

      {/* Validate button */}
      <button
        onClick={validate}
        style={{
          marginTop: "12px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 600,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Validate
      </button>

      {/* Results */}
      {parseError && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          <strong>JSON Parse Error:</strong> {parseError}
        </div>
      )}

      {isValid === true && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          ✓ Valid AI-Me vendor card
        </div>
      )}

      {isValid === false && errors.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          <strong>Validation errors ({errors.length}):</strong>
          <ul style={{ marginTop: "8px", paddingLeft: "16px" }}>
            {errors.map((err, i) => (
              <li key={i} style={{ marginBottom: "4px" }}>
                <code style={{ fontSize: "12px", background: "#fee2e2", padding: "1px 4px", borderRadius: "3px" }}>
                  {err.path}
                </code>{" "}
                — {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

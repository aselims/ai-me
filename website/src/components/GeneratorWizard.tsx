import { useState, useEffect, useRef } from "preact/hooks";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// ── Types ────────────────────────────────────────────────────────

interface Props {
  schema: Record<string, unknown>;
}

interface Offering {
  name: string;
  type: string;
  description: string;
  pricing: { model: string; currency: string; url: string };
  cta: { label: string; url: string };
}

interface FormState {
  // Required
  name: string;
  website: string;
  summary: string;
  home: string;
  contact: string;
  // Optional identity
  legal_name: string;
  logo: string;
  languages: string;
  regions: string;
  category: string;
  // Optional pages
  pricing: string;
  docs: string;
  privacy: string;
  terms: string;
  security: string;
  imprint: string;
  // Offerings
  offerings: Offering[];
  // Related
  schema_org: string;
  llms_txt: string;
  mcp: string;
  a2a: string;
  // Support
  support_email: string;
  support_hours: string;
  support_response_time: string;
  // Technical
  api_available: boolean;
  api_docs_url: string;
  status_page_url: string;
}

const STEPS = ["Basics", "Pages", "Offerings", "Related", "Support", "Technical", "Review"] as const;

const OFFERING_TYPES = ["service", "product", "subscription", "api", "tool", "content", "open_source", "other"];
const PRICING_MODELS = ["free", "freemium", "fixed", "tiered", "usage", "quote", "contact_sales", "daily_rate", "open_source"];

const emptyOffering = (): Offering => ({
  name: "",
  type: "service",
  description: "",
  pricing: { model: "free", currency: "", url: "" },
  cta: { label: "", url: "" },
});

// ── Umami helper ─────────────────────────────────────────────────

function track(eventName: string) {
  try {
    if (typeof window !== "undefined" && (window as any).umami) {
      (window as any).umami.track(eventName);
    }
  } catch {
    // silently ignore if Umami is not loaded
  }
}

// ── Styles ───────────────────────────────────────────────────────

const inputStyle: Record<string, string> = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "14px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#fff",
  color: "#111827",
};

const labelStyle: Record<string, string> = {
  display: "block",
  marginBottom: "4px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
};

const btnPrimary: Record<string, string> = {
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: "600",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const btnSecondary: Record<string, string> = {
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: "500",
  background: "#fff",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  cursor: "pointer",
};

// ── Component ────────────────────────────────────────────────────

export default function GeneratorWizard({ schema }: Props) {
  const [step, setStep] = useState<number>(0);
  const [form, setForm] = useState<FormState>({
    name: "", website: "", summary: "", home: "", contact: "",
    legal_name: "", logo: "", languages: "", regions: "", category: "",
    pricing: "", docs: "", privacy: "", terms: "", security: "", imprint: "",
    offerings: [],
    schema_org: "", llms_txt: "", mcp: "", a2a: "",
    support_email: "", support_hours: "", support_response_time: "",
    api_available: false, api_docs_url: "", status_page_url: "",
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    if (!hasTrackedStart.current) {
      track("generator-start");
      hasTrackedStart.current = true;
    }
  }, []);

  // ── Build JSON from form state ──

  function buildCard(): Record<string, unknown> {
    const today = new Date().toISOString().slice(0, 10);
    const card: Record<string, unknown> = {
      schema_version: "0.1",
      name: form.name,
      website: form.website,
      summary: form.summary,
    };

    if (form.legal_name) card.legal_name = form.legal_name;
    if (form.logo) card.logo = form.logo;
    if (form.languages) card.languages = form.languages.split(",").map((s) => s.trim()).filter(Boolean);
    if (form.regions) card.regions = form.regions.split(",").map((s) => s.trim()).filter(Boolean);
    if (form.category) card.category = form.category.split(",").map((s) => s.trim()).filter(Boolean);

    const pages: Record<string, string> = {};
    if (form.home) pages.home = form.home;
    if (form.contact) pages.contact = form.contact;
    if (form.pricing) pages.pricing = form.pricing;
    if (form.docs) pages.docs = form.docs;
    if (form.privacy) pages.privacy = form.privacy;
    if (form.terms) pages.terms = form.terms;
    if (form.security) pages.security = form.security;
    if (form.imprint) pages.imprint = form.imprint;
    card.canonical_pages = pages;

    if (form.offerings.length > 0) {
      card.offerings = form.offerings.filter((o) => o.name);
    }

    const related: Record<string, string> = {};
    if (form.schema_org) related.schema_org = form.schema_org;
    if (form.llms_txt) related.llms_txt = form.llms_txt;
    if (form.mcp) related.mcp = form.mcp;
    if (form.a2a) related.a2a = form.a2a;
    if (Object.keys(related).length > 0) card.related = related;

    const support: Record<string, string> = {};
    if (form.support_email) support.email = form.support_email;
    if (form.support_hours) support.hours = form.support_hours;
    if (form.support_response_time) support.response_time = form.support_response_time;
    if (Object.keys(support).length > 0) card.support = support;

    const technical: Record<string, unknown> = {};
    if (form.api_available) technical.api_available = true;
    if (form.api_docs_url) technical.api_docs_url = form.api_docs_url;
    if (form.status_page_url) technical.status_page_url = form.status_page_url;
    if (Object.keys(technical).length > 0) card.technical = technical;

    card.last_updated = today;
    return card;
  }

  function validateJSON() {
    const card = buildCard();
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(card);
    if (valid) {
      setValidationErrors([]);
    } else {
      setValidationErrors(
        (validate.errors || []).map((e) => `${e.instancePath || "/"} — ${e.message || "Unknown"}`)
      );
    }
    return valid;
  }

  // ── Navigation ──

  function goNext() {
    track(`generator-step-${STEPS[step].toLowerCase()}`);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      if (step + 1 === STEPS.length - 1) {
        track("generator-complete");
      }
    }
  }

  function goPrev() {
    if (step > 0) setStep(step - 1);
  }

  // ── Field helpers ──

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateOffering(index: number, path: string, value: string) {
    setForm((prev) => {
      const offerings = [...prev.offerings];
      const parts = path.split(".");
      const o = { ...offerings[index] } as any;

      if (parts.length === 1) {
        o[parts[0]] = value;
      } else {
        o[parts[0]] = { ...o[parts[0]], [parts[1]]: value };
      }

      offerings[index] = o;
      return { ...prev, offerings };
    });
  }

  function addOffering() {
    setForm((prev) => ({ ...prev, offerings: [...prev.offerings, emptyOffering()] }));
  }

  function removeOffering(index: number) {
    setForm((prev) => ({
      ...prev,
      offerings: prev.offerings.filter((_, i) => i !== index),
    }));
  }

  // ── Copy & Download ──

  async function copyJSON() {
    const json = JSON.stringify(buildCard(), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopyFeedback("Copied!");
      track("generator-copy");
    } catch {
      setCopyFeedback("Copy failed");
    }
    setTimeout(() => setCopyFeedback(""), 2000);
  }

  function downloadJSON() {
    const json = JSON.stringify(buildCard(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-me.json";
    a.click();
    URL.revokeObjectURL(url);
    track("generator-download");
  }

  // ── Auto-fill home/contact from website ──

  function onWebsiteBlur() {
    if (form.website && !form.home) {
      updateField("home", form.website.replace(/\/$/, "") + "/");
    }
    if (form.website && !form.contact) {
      updateField("contact", form.website.replace(/\/$/, "") + "/contact");
    }
  }

  // ── Render helpers ──

  function renderInput(label: string, field: keyof FormState, opts?: { placeholder?: string; required?: boolean; type?: string; onBlur?: () => void }) {
    return (
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>
          {label} {opts?.required && <span style={{ color: "#dc2626" }}>*</span>}
        </label>
        <input
          type={opts?.type || "text"}
          value={form[field] as string}
          onInput={(e) => updateField(field, (e.target as HTMLInputElement).value)}
          onBlur={opts?.onBlur}
          placeholder={opts?.placeholder || ""}
          style={inputStyle}
        />
      </div>
    );
  }

  function renderSelect(label: string, value: string, options: string[], onChange: (v: string) => void) {
    return (
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>{label}</label>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{ ...inputStyle, appearance: "auto" as any }}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  // ── Step renderers ──

  function renderBasics() {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Basic Information</h3>
        {renderInput("Organization / Project Name", "name", { required: true, placeholder: "Your Company" })}
        {renderInput("Website URL", "website", { required: true, placeholder: "https://example.com", onBlur: onWebsiteBlur })}
        {renderInput("Summary", "summary", { required: true, placeholder: "What you do, in one sentence." })}
        {renderInput("Legal Name", "legal_name", { placeholder: "Your Company Inc." })}
        {renderInput("Logo URL", "logo", { placeholder: "https://example.com/logo.png" })}
        {renderInput("Languages (comma-separated BCP 47)", "languages", { placeholder: "en, de" })}
        {renderInput("Regions (comma-separated)", "regions", { placeholder: "US, EU" })}
        {renderInput("Categories (comma-separated)", "category", { placeholder: "saas, enterprise" })}
      </div>
    );
  }

  function renderPages() {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Canonical Pages</h3>
        {renderInput("Home Page URL *", "home", { required: true, placeholder: "https://example.com/" })}
        {renderInput("Contact Page URL *", "contact", { required: true, placeholder: "https://example.com/contact" })}
        {renderInput("Pricing", "pricing", { placeholder: "https://example.com/pricing" })}
        {renderInput("Docs", "docs", { placeholder: "https://example.com/docs" })}
        {renderInput("Privacy Policy", "privacy", { placeholder: "https://example.com/privacy" })}
        {renderInput("Terms of Service", "terms", { placeholder: "https://example.com/terms" })}
        {renderInput("Security", "security", { placeholder: "https://example.com/security" })}
        {renderInput("Imprint", "imprint", { placeholder: "https://example.com/imprint" })}
      </div>
    );
  }

  function renderOfferings() {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Offerings</h3>
        {form.offerings.map((o, i) => (
          <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginBottom: "16px", background: "#fafafa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <strong style={{ fontSize: "14px", color: "#374151" }}>Offering #{i + 1}</strong>
              <button onClick={() => removeOffering(i)} style={{ ...btnSecondary, padding: "4px 12px", fontSize: "12px", color: "#dc2626", borderColor: "#fca5a5" }}>Remove</button>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} value={o.name} onInput={(e) => updateOffering(i, "name", (e.target as HTMLInputElement).value)} />
            </div>
            {renderSelect("Type", o.type, OFFERING_TYPES, (v) => updateOffering(i, "type", v))}
            <div style={{ marginBottom: "8px" }}>
              <label style={labelStyle}>Description *</label>
              <input style={inputStyle} value={o.description} onInput={(e) => updateOffering(i, "description", (e.target as HTMLInputElement).value)} />
            </div>
            {renderSelect("Pricing Model", o.pricing.model, PRICING_MODELS, (v) => updateOffering(i, "pricing.model", v))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
              <div>
                <label style={labelStyle}>Currency</label>
                <input style={inputStyle} placeholder="USD" value={o.pricing.currency} onInput={(e) => updateOffering(i, "pricing.currency", (e.target as HTMLInputElement).value)} />
              </div>
              <div>
                <label style={labelStyle}>Pricing URL</label>
                <input style={inputStyle} placeholder="https://..." value={o.pricing.url} onInput={(e) => updateOffering(i, "pricing.url", (e.target as HTMLInputElement).value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>CTA Label *</label>
                <input style={inputStyle} placeholder="Start free trial" value={o.cta.label} onInput={(e) => updateOffering(i, "cta.label", (e.target as HTMLInputElement).value)} />
              </div>
              <div>
                <label style={labelStyle}>CTA URL *</label>
                <input style={inputStyle} placeholder="https://..." value={o.cta.url} onInput={(e) => updateOffering(i, "cta.url", (e.target as HTMLInputElement).value)} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addOffering} style={btnSecondary}>+ Add Offering</button>
      </div>
    );
  }

  function renderRelated() {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Related Protocol Links</h3>
        {renderInput("Schema.org JSON-LD URL", "schema_org", { placeholder: "https://example.com/schema.jsonld" })}
        {renderInput("llms.txt URL", "llms_txt", { placeholder: "https://example.com/.well-known/llms.txt" })}
        {renderInput("MCP Server Manifest URL", "mcp", { placeholder: "https://example.com/.well-known/mcp.json" })}
        {renderInput("A2A Agent Card URL", "a2a", { placeholder: "https://example.com/.well-known/agent.json" })}
      </div>
    );
  }

  function renderSupport() {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Support Information</h3>
        {renderInput("Support Email", "support_email", { placeholder: "support@example.com", type: "email" })}
        {renderInput("Support Hours", "support_hours", { placeholder: "Mon-Fri 09:00-17:00 EST" })}
        {renderInput("Response Time", "support_response_time", { placeholder: "24 hours" })}
      </div>
    );
  }

  function renderTechnical() {
    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Technical Information</h3>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={form.api_available}
              onChange={(e) => updateField("api_available", (e.target as HTMLInputElement).checked)}
            />
            API Available
          </label>
        </div>
        {renderInput("API Docs URL", "api_docs_url", { placeholder: "https://example.com/docs/api" })}
        {renderInput("Status Page URL", "status_page_url", { placeholder: "https://status.example.com" })}
      </div>
    );
  }

  function renderReview() {
    const card = buildCard();
    const json = JSON.stringify(card, null, 2);

    return (
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Review & Export</h3>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button onClick={() => { validateJSON(); }} style={btnPrimary}>Validate</button>
          <button onClick={copyJSON} style={btnSecondary}>
            {copyFeedback || "Copy JSON"}
          </button>
          <button onClick={downloadJSON} style={btnSecondary}>Download ai-me.json</button>
        </div>

        {validationErrors.length === 0 && step === STEPS.length - 1 && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
            ✓ Valid AI-Me vendor card
          </div>
        )}

        {validationErrors.length > 0 && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: "14px", marginBottom: "16px" }}>
            <strong>Validation errors ({validationErrors.length}):</strong>
            <ul style={{ marginTop: "8px", paddingLeft: "16px" }}>
              {validationErrors.map((err, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>
                  <code style={{ fontSize: "12px", background: "#fee2e2", padding: "1px 4px", borderRadius: "3px" }}>{err}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        <textarea
          value={json}
          readOnly
          rows={20}
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
        />
      </div>
    );
  }

  const stepRenderers = [renderBasics, renderPages, renderOfferings, renderRelated, renderSupport, renderTechnical, renderReview];

  // ── Main render ──

  return (
    <div>
      {/* Stepper */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            style={{
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: i === step ? "700" : "500",
              border: "1px solid",
              borderColor: i === step ? "#2563eb" : "#d1d5db",
              borderRadius: "6px",
              background: i === step ? "#eff6ff" : "#fff",
              color: i === step ? "#1e40af" : "#6b7280",
              cursor: "pointer",
            }}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ minHeight: "300px" }}>
        {stepRenderers[step]()}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
        <button onClick={goPrev} disabled={step === 0} style={{ ...btnSecondary, opacity: step === 0 ? 0.5 : 1 }}>
          ← Previous
        </button>
        {step < STEPS.length - 1 && (
          <button onClick={goNext} style={btnPrimary}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

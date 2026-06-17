"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import { uploadWelfareTechImage, validateWelfareTechImage } from "@/lib/welfare-tech-storage";
import type { WelfareTechnology } from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const inputStyle: React.CSSProperties = {
  padding: `${space.s8} ${space.s12}`,
  border: `1px solid ${colors.borderSubtle}`,
  fontSize: 14,
  fontFamily: FONT_STACK,
  background: colors.bgCard,
  color: colors.textBody,
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: colors.textMuted,
};

interface FormState {
  title: string;
  description: string;
  category: string;
  tags: string;
  url: string;
  image_url: string;
  manufacturer: string;
  country_availability: string;
  notes: string;
  published: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  tags: "",
  url: "",
  image_url: "",
  manufacturer: "",
  country_availability: "",
  notes: "",
  published: false,
};

function splitList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function joinList(values: string[] | null | undefined): string {
  return (values ?? []).join(", ");
}

export function WelfareTechPanel({ currentUserId }: { currentUserId: string | null }) {
  const [items, setItems] = useState<WelfareTechnology[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("welfare_technologies")
      .select("*")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) {
      setStatus({ kind: "err", msg: error.message });
      setItems([]);
      return;
    }
    setItems((data as WelfareTechnology[]) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!pendingImage) {
      setPendingPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  function clearPendingImage() {
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(item: WelfareTechnology) {
    clearPendingImage();
    setEditId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category ?? "",
      tags: joinList(item.tags),
      url: item.url ?? "",
      image_url: item.image_url ?? "",
      manufacturer: item.manufacturer ?? "",
      country_availability: joinList(item.country_availability),
      notes: item.notes ?? "",
      published: item.published,
    });
    setStatus(null);
  }

  function startCreate() {
    clearPendingImage();
    setEditId(null);
    setForm(EMPTY_FORM);
    setStatus(null);
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateWelfareTechImage(file);
    if (validationError) {
      setStatus({ kind: "err", msg: validationError });
      e.target.value = "";
      return;
    }
    setStatus(null);
    setPendingImage(file);
    setForm((f) => ({ ...f, image_url: "" }));
  }

  function clearImage() {
    clearPendingImage();
    setForm((f) => ({ ...f, image_url: "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setStatus({ kind: "err", msg: "Tittel og beskrivelse er obligatoriske." });
      return;
    }
    setSubmitting(true);
    setStatus(null);

    let imageUrl = form.image_url.trim() || null;
    if (pendingImage) {
      try {
        imageUrl = await uploadWelfareTechImage(pendingImage);
      } catch (err) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: (err as Error).message });
        return;
      }
    }

    const row = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
      tags: splitList(form.tags),
      url: form.url.trim() || null,
      image_url: imageUrl,
      manufacturer: form.manufacturer.trim() || null,
      country_availability: splitList(form.country_availability),
      notes: form.notes.trim() || null,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from("welfare_technologies").update(row).eq("id", editId);
      if (error) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: error.message });
        return;
      }
      setStatus({ kind: "ok", msg: "Oppdatert." });
      clearPendingImage();
    } else {
      const { error } = await supabase
        .from("welfare_technologies")
        .insert({ ...row, created_by: currentUserId });
      if (error) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: error.message });
        return;
      }
      setStatus({ kind: "ok", msg: "Lagret." });
      setForm(EMPTY_FORM);
      clearPendingImage();
    }
    setSubmitting(false);
    await reload();
  }

  async function togglePublish(item: WelfareTechnology) {
    const { error } = await supabase
      .from("welfare_technologies")
      .update({ published: !item.published, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) {
      alert(error.message);
      return;
    }
    await reload();
  }

  async function remove(item: WelfareTechnology) {
    if (!confirm(`Slette «${item.title}»?`)) return;
    const { error } = await supabase.from("welfare_technologies").delete().eq("id", item.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (editId === item.id) startCreate();
    await reload();
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 1.2fr)",
        gap: space.s32,
        alignItems: "flex-start",
      }}
    >
      <section style={{ display: "flex", flexDirection: "column", gap: space.s16 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: space.s8,
          }}
        >
          <h2
            style={{
              ...typography.sizes.t22,
              fontWeight: typography.weights.bold,
              color: colors.textBody,
            }}
          >
            {editId ? "Rediger oppføring" : "Ny oppføring"}
          </h2>
          {editId && (
            <button
              type="button"
              onClick={startCreate}
              style={{
                ...typography.sizes.t12,
                background: "transparent",
                border: "none",
                color: colors.textMuted,
                cursor: "pointer",
                fontFamily: FONT_STACK,
              }}
            >
              + Ny i stedet
            </button>
          )}
        </header>

        <form
          onSubmit={submit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: space.s12,
            padding: space.s24,
            background: colors.bgCard,
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <Field label="Tittel">
            <input
              required
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Beskrivelse">
            <textarea
              required
              style={{ ...inputStyle, minHeight: 100 }}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Field label="Kategori">
            <input
              style={inputStyle}
              placeholder="f.eks. Communication, Safety, Mobility"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </Field>
          <Field label="Tagger (kommaseparert)">
            <input
              style={inputStyle}
              placeholder="ai, urdu, tablet"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </Field>
          <Field label="Lenke">
            <input
              type="url"
              style={inputStyle}
              placeholder="https://…"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </Field>
          <Field label="Bilde">
            <ImageUploadField
              previewUrl={pendingPreviewUrl ?? (form.image_url.trim() || null)}
              fileInputRef={fileInputRef}
              onFileChange={handleImageFileChange}
              onClear={clearImage}
              imageUrl={form.image_url}
              onImageUrlChange={(image_url) => {
                clearPendingImage();
                setForm((f) => ({ ...f, image_url }));
              }}
            />
          </Field>
          <Field label="Produsent">
            <input
              style={inputStyle}
              value={form.manufacturer}
              onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
            />
          </Field>
          <Field label="Land tilgjengelig (kommaseparert)">
            <input
              style={inputStyle}
              placeholder="Norway, Denmark"
              value={form.country_availability}
              onChange={(e) => setForm((f) => ({ ...f, country_availability: e.target.value }))}
            />
          </Field>
          <Field label="Kuratornotat">
            <textarea
              style={{ ...inputStyle, minHeight: 80 }}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: space.s8,
              padding: `${space.s8} ${space.s12}`,
              background: form.published ? "#c7fde9" : colors.bgSubtle,
              border: `1px solid ${form.published ? "#43f8b6" : colors.borderSubtle}`,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              style={{ accentColor: "#034b45" }}
            />
            <span style={{ ...typography.sizes.t14, color: colors.textBody }}>
              Publisert{form.published ? "" : " (lagre som utkast)"}
            </span>
          </label>

          {status && (
            <p
              style={{
                ...typography.sizes.t14,
                padding: `${space.s8} ${space.s12}`,
                background: status.kind === "ok" ? "#c7fde9" : "#fff2f1",
                border: `1px solid ${status.kind === "ok" ? "#43f8b6" : "#ffdfdc"}`,
                color: status.kind === "ok" ? "#034b45" : "#a83f34",
              }}
            >
              {status.msg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: "flex-start",
              ...typography.sizes.t14,
              padding: `${space.s12} ${space.s24}`,
              background: colors.brandWarmBlue,
              color: colors.textLight,
              border: `1px solid ${colors.brandWarmBlue}`,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              fontFamily: FONT_STACK,
              fontWeight: typography.weights.medium,
            }}
          >
            {submitting ? "Lagrer…" : editId ? "Lagre endringer" : "Lagre"}
          </button>
        </form>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: space.s12 }}>
        <p style={labelStyle}>Eksisterende oppføringer</p>
        {loading && items.length === 0 ? (
          <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>Laster…</p>
        ) : items.length === 0 ? (
          <p
            style={{
              ...typography.sizes.t14,
              color: colors.textMuted,
              padding: space.s16,
              border: `1px dashed ${colors.borderSubtle}`,
            }}
          >
            Ingen oppføringer ennå.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s8 }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: space.s12,
                  padding: space.s12,
                  background: colors.bgCard,
                  border: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ ...typography.sizes.t14, fontWeight: typography.weights.medium, color: colors.textBody }}>
                    {item.title}
                  </p>
                  <p style={{ ...typography.sizes.t12, color: colors.textMuted, marginTop: 2 }}>
                    {item.category ?? "—"}
                    {item.manufacturer ? ` · ${item.manufacturer}` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: space.s4, alignItems: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => togglePublish(item)}
                    style={{
                      ...typography.sizes.t12,
                      padding: `2px ${space.s8}`,
                      background: item.published ? "#034b45" : colors.bgCard,
                      color: item.published ? colors.textLight : colors.textMuted,
                      border: `1px solid ${item.published ? "#034b45" : colors.borderSubtle}`,
                      cursor: "pointer",
                      fontFamily: FONT_STACK,
                      fontWeight: typography.weights.medium,
                    }}
                  >
                    {item.published ? "Publisert" : "Utkast"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    style={{
                      ...typography.sizes.t12,
                      background: "transparent",
                      border: "none",
                      color: colors.brandWarmBlue,
                      cursor: "pointer",
                      fontFamily: FONT_STACK,
                      fontWeight: typography.weights.medium,
                    }}
                  >
                    Rediger
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    style={{
                      ...typography.sizes.t12,
                      background: "transparent",
                      border: "none",
                      color: "#a83f34",
                      cursor: "pointer",
                      fontFamily: FONT_STACK,
                    }}
                  >
                    Slett
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function ImageUploadField({
  previewUrl,
  fileInputRef,
  onFileChange,
  onClear,
  imageUrl,
  onImageUrlChange,
}: {
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
      {previewUrl ? (
        <div style={{ position: "relative", alignSelf: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Forhåndsvisning"
            style={{
              display: "block",
              width: 200,
              height: 150,
              objectFit: "cover",
              border: `1px solid ${colors.borderSubtle}`,
              background: colors.bgSubtle,
            }}
          />
          <button
            type="button"
            onClick={onClear}
            aria-label="Fjern bilde"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              padding: 0,
              border: "none",
              borderRadius: "50%",
              background: "rgba(42, 40, 89, 0.75)",
              color: colors.textLight,
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              fontFamily: FONT_STACK,
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          style={{
            width: 200,
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.bgSubtle,
            border: `1px dashed ${colors.borderSubtle}`,
            ...typography.sizes.t12,
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Ingen bilde
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onFileChange}
        style={{
          ...typography.sizes.t14,
          fontFamily: FONT_STACK,
          color: colors.textBody,
        }}
      />

      <input
        type="url"
        style={inputStyle}
        placeholder="Eller lim inn bilde-URL"
        value={imageUrl}
        onChange={(e) => onImageUrlChange(e.target.value)}
      />
      <p style={{ ...typography.sizes.t12, color: colors.textMuted, margin: 0 }}>
        JPEG, PNG, WebP eller GIF · maks 5 MB
      </p>
    </div>
  );
}

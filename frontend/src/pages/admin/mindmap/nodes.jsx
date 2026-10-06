import React, { useRef, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import {
  Trash2, Upload, Loader2, ImageIcon, FileText, Link2, Palette,
  ListChecks, Plus, Check, Download, Play, ExternalLink, Copy,
} from "lucide-react";
import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND}/api`;

export const fileUrl = (u) => (u && u.startsWith("/") ? `${BACKEND}${u}` : u);

export const NOTE_COLORS = [
  { bg: "#FFF8C5", br: "#F2E27A" },
  { bg: "#DFF3FF", br: "#A8DDF5" },
  { bg: "#E8FBE8", br: "#AEE6AE" },
  { bg: "#FFE8EC", br: "#F6B8C4" },
  { bg: "#F0E9FF", br: "#CDB9F2" },
  { bg: "#FFFFFF", br: "#E3E6EA" },
];

const HANDLE_IDS = ["t", "r", "b", "l"];
const HANDLE_POS = { t: Position.Top, r: Position.Right, b: Position.Bottom, l: Position.Left };

function NodeHandles() {
  return (
    <>
      {HANDLE_IDS.map((id) => (
        <Handle
          key={id}
          id={id}
          type="source"
          position={HANDLE_POS[id]}
          className="mm-handle"
        />
      ))}
    </>
  );
}

function useNodeApi(id) {
  const { updateNodeData, setNodes, setEdges } = useReactFlow();
  const patch = (d) => updateNodeData(id, d);
  const remove = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };
  return { patch, remove };
}

function NodeFrame({ children, onDelete, className = "", style, testid }) {
  return (
    <div
      data-testid={testid}
      className={`group relative rounded-2xl border shadow-md shadow-ink/5 transition-shadow hover:shadow-lg ${className}`}
      style={style}
    >
      <button
        onClick={onDelete}
        data-testid="mm-node-delete"
        className="nodrag absolute -right-2.5 -top-2.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/40 opacity-0 shadow-sm transition-opacity hover:text-red-500 group-hover:opacity-100"
        title="Διαγραφή"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <NodeHandles />
      {children}
    </div>
  );
}

/* ---------------- Note ---------------- */
export function NoteNode({ id, data }) {
  const { patch, remove } = useNodeApi(id);
  const ci = data.colorIndex ?? 0;
  const c = NOTE_COLORS[ci] || NOTE_COLORS[0];
  return (
    <NodeFrame
      onDelete={remove}
      testid="mm-note-node"
      className="w-56"
      style={{ background: c.bg, borderColor: c.br }}
    >
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="nodrag mb-1.5 flex items-center gap-1">
          {NOTE_COLORS.map((col, i) => (
            <button
              key={i}
              onClick={() => patch({ colorIndex: i })}
              className={`h-3.5 w-3.5 rounded-full border transition-transform hover:scale-110 ${i === ci ? "ring-2 ring-ink/40" : ""}`}
              style={{ background: col.bg, borderColor: col.br }}
            />
          ))}
        </div>
        <textarea
          data-testid="mm-note-text"
          value={data.text || ""}
          onChange={(e) => patch({ text: e.target.value })}
          placeholder="Γράψε μια σημείωση…"
          rows={4}
          className="nodrag nowheel w-full resize-none bg-transparent text-sm leading-snug text-ink placeholder:text-ink/35 outline-none"
        />
      </div>
    </NodeFrame>
  );
}

/* ---------------- Upload helper ---------------- */
function useUploader(token) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upload = async (file) => {
    setErr("");
    if (file.size > 20 * 1024 * 1024) {
      setErr("Μέγιστο 20MB");
      return null;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/mindmap/upload`, fd, {
        headers: { "X-Admin-Token": token, "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (e) {
      setErr(e?.response?.data?.detail || "Η μεταφόρτωση απέτυχε");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy, err };
}

/* ---------------- Image ---------------- */
export function ImageNode({ id, data }) {
  const { patch, remove } = useNodeApi(id);
  const token = data.__token;
  const { upload, busy, err } = useUploader(token);
  const inputRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = await upload(file);
    if (r) patch({ fileId: r.id, url: r.url, name: r.name });
  };

  return (
    <NodeFrame onDelete={remove} testid="mm-image-node" className="w-64 bg-white" style={{ borderColor: "#E3E6EA" }}>
      {data.url ? (
        <img
          src={fileUrl(data.url)}
          alt={data.name || "image"}
          className="h-40 w-full rounded-t-2xl object-cover"
          draggable={false}
        />
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          data-testid="mm-image-upload"
          className="nodrag flex h-40 w-full flex-col items-center justify-center gap-2 rounded-t-2xl bg-mist/60 text-ink/40 transition-colors hover:bg-mist"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
          <span className="text-xs font-semibold">{busy ? "Μεταφόρτωση…" : "Ανέβασε εικόνα"}</span>
        </button>
      )}
      <div className="px-3 py-2">
        <input
          data-testid="mm-image-caption"
          value={data.caption || ""}
          onChange={(e) => patch({ caption: e.target.value })}
          placeholder="Λεζάντα…"
          className="nodrag w-full bg-transparent text-xs text-ink placeholder:text-ink/35 outline-none"
        />
        {err && <p className="mt-1 text-[10px] font-semibold text-red-500">{err}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
    </NodeFrame>
  );
}

/* ---------------- File / Video ---------------- */
export function FileNode({ id, data }) {
  const { patch, remove } = useNodeApi(id);
  const token = data.__token;
  const { upload, busy, err } = useUploader(token);
  const inputRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = await upload(file);
    if (r) patch({ fileId: r.id, url: r.url, name: r.name, kind: r.kind, contentType: r.content_type, size: r.size });
  };

  const sizeLabel = data.size ? `${(data.size / 1024 / 1024).toFixed(1)} MB` : "";

  return (
    <NodeFrame onDelete={remove} testid="mm-file-node" className="w-64 bg-white" style={{ borderColor: "#E3E6EA" }}>
      {!data.url ? (
        <button
          onClick={() => inputRef.current?.click()}
          data-testid="mm-file-upload"
          className="nodrag flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-mist/60 text-ink/40 transition-colors hover:bg-mist"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="text-xs font-semibold">{busy ? "Μεταφόρτωση…" : "Ανέβασε αρχείο (PDF, MP4…)"}</span>
          {err && <span className="text-[10px] font-semibold text-red-500">{err}</span>}
        </button>
      ) : data.kind === "video" ? (
        <div>
          <video
            src={fileUrl(data.url)}
            controls
            className="nodrag nowheel h-40 w-full rounded-t-2xl bg-black object-contain"
          />
          <div className="flex items-center gap-2 px-3 py-2">
            <Play className="h-4 w-4 shrink-0 text-baby-dark" />
            <span className="truncate text-xs font-semibold text-ink">{data.name}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3.5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-baby-light text-baby-dark">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{data.name}</p>
            <p className="text-[11px] text-ink/45">{sizeLabel}</p>
          </div>
          <a
            href={`${fileUrl(data.url)}?download=1`}
            target="_blank"
            rel="noreferrer"
            className="nodrag inline-flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-mist hover:text-baby-dark"
            title="Λήψη"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      )}
      <input ref={inputRef} type="file" hidden onChange={onFile} />
    </NodeFrame>
  );
}

/* ---------------- Link ---------------- */
export function LinkNode({ id, data }) {
  const { patch, remove } = useNodeApi(id);
  const href = data.url && !/^https?:\/\//i.test(data.url) ? `https://${data.url}` : data.url;
  return (
    <NodeFrame onDelete={remove} testid="mm-link-node" className="w-60 bg-white" style={{ borderColor: "#E3E6EA" }}>
      <div className="p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-baby-light text-baby-dark">
            <Link2 className="h-3.5 w-3.5" />
          </span>
          <input
            data-testid="mm-link-title"
            value={data.title || ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Τίτλος συνδέσμου"
            className="nodrag min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink placeholder:text-ink/35 outline-none"
          />
        </div>
        <input
          data-testid="mm-link-url"
          value={data.url || ""}
          onChange={(e) => patch({ url: e.target.value })}
          placeholder="https://pinterest.com/…"
          className="nodrag w-full rounded-lg bg-mist/50 px-2.5 py-1.5 text-xs text-ink placeholder:text-ink/35 outline-none"
        />
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="nodrag mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-baby-dark hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />Άνοιγμα
          </a>
        )}
      </div>
    </NodeFrame>
  );
}

/* ---------------- Color palette ---------------- */
export function ColorNode({ id, data }) {
  const { patch, remove } = useNodeApi(id);
  const swatches = data.swatches || ["#89CFF0", "#1B2430", "#F5F7FA"];
  const [copied, setCopied] = useState(null);

  const setSwatch = (i, hex) => {
    const next = [...swatches];
    next[i] = hex;
    patch({ swatches: next });
  };
  const addSwatch = () => patch({ swatches: [...swatches, "#CCCCCC"] });
  const removeSwatch = (i) => patch({ swatches: swatches.filter((_, idx) => idx !== i) });
  const copy = (hex) => {
    navigator.clipboard?.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <NodeFrame onDelete={remove} testid="mm-color-node" className="w-56 bg-white" style={{ borderColor: "#E3E6EA" }}>
      <div className="p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink/55">
          <Palette className="h-3.5 w-3.5 text-baby-dark" />Παλέτα χρωμάτων
        </div>
        <div className="space-y-1.5">
          {swatches.map((hex, i) => (
            <div key={i} className="group/sw flex items-center gap-2">
              <label className="nodrag relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-ink/10" style={{ background: hex }}>
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => setSwatch(i, e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <button
                onClick={() => copy(hex)}
                className="nodrag flex-1 text-left font-mono text-xs text-ink/70 hover:text-ink"
              >
                {copied === hex ? "Αντιγράφηκε!" : hex.toUpperCase()}
              </button>
              <button onClick={() => removeSwatch(i)} className="nodrag text-ink/25 hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addSwatch}
          data-testid="mm-color-add"
          className="nodrag mt-2 inline-flex items-center gap-1 text-xs font-bold text-baby-dark hover:underline"
        >
          <Plus className="h-3 w-3" />Προσθήκη χρώματος
        </button>
      </div>
    </NodeFrame>
  );
}

/* ---------------- Checklist ---------------- */
let itemSeq = 0;
const newItemId = () => `it-${Date.now()}-${itemSeq++}`;

export function ChecklistNode({ id, data }) {
  const { patch, remove } = useNodeApi(id);
  const items = data.items || [];
  const [draft, setDraft] = useState("");

  const addItem = () => {
    if (!draft.trim()) return;
    patch({ items: [...items, { id: newItemId(), text: draft.trim(), done: false }] });
    setDraft("");
  };
  const toggle = (i) => patch({ items: items.map((it) => (it.id === i ? { ...it, done: !it.done } : it)) });
  const editItem = (i, text) => patch({ items: items.map((it) => (it.id === i ? { ...it, text } : it)) });
  const removeItem = (i) => patch({ items: items.filter((it) => it.id !== i) });

  const done = items.filter((it) => it.done).length;

  return (
    <NodeFrame onDelete={remove} testid="mm-checklist-node" className="w-64 bg-white" style={{ borderColor: "#E3E6EA" }}>
      <div className="p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <input
            data-testid="mm-checklist-title"
            value={data.title || ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Λίστα εργασιών"
            className="nodrag min-w-0 flex-1 bg-transparent text-sm font-bold text-ink placeholder:text-ink/35 outline-none"
          />
          {items.length > 0 && (
            <span className="shrink-0 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold text-ink/55">{done}/{items.length}</span>
          )}
        </div>
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2">
              <button
                onClick={() => toggle(it.id)}
                className={`nodrag flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${it.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink/25 text-transparent"}`}
              >
                <Check className="h-3 w-3" />
              </button>
              <input
                value={it.text}
                onChange={(e) => editItem(it.id, e.target.value)}
                className={`nodrag min-w-0 flex-1 bg-transparent text-xs outline-none ${it.done ? "text-ink/40 line-through" : "text-ink/80"}`}
              />
              <button onClick={() => removeItem(it.id)} className="nodrag text-ink/25 hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-1.5">
          <input
            data-testid="mm-checklist-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            placeholder="Νέο στοιχείο…"
            className="nodrag min-w-0 flex-1 rounded-lg bg-mist/50 px-2.5 py-1.5 text-xs text-ink placeholder:text-ink/35 outline-none"
          />
          <button onClick={addItem} className="nodrag inline-flex shrink-0 items-center rounded-lg bg-ink px-2 text-white">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </NodeFrame>
  );
}

export const nodeTypes = {
  note: NoteNode,
  image: ImageNode,
  file: FileNode,
  link: LinkNode,
  color: ColorNode,
  checklist: ChecklistNode,
};

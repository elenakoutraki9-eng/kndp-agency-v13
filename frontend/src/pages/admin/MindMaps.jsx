import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, useReactFlow,
  ConnectionMode, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Loader2, ArrowLeft, StickyNote, ImageIcon, FileUp, Link2, Palette,
  ListChecks, FolderKanban, Users, Network, Check, Cloud, ChevronRight,
} from "lucide-react";
import { API, authCfg, SectionHeader } from "./shared";
import { nodeTypes } from "./mindmap/nodes";

let nodeSeq = 0;
const newNodeId = () => `n-${Date.now()}-${nodeSeq++}`;

const NODE_DEFAULTS = {
  note: { colorIndex: 0, text: "" },
  image: { caption: "" },
  file: {},
  link: { title: "", url: "" },
  color: { swatches: ["#89CFF0", "#1B2430", "#F5F7FA"] },
  checklist: { title: "", items: [] },
};

const TOOLS = [
  { type: "note", label: "Σημείωση", icon: StickyNote },
  { type: "image", label: "Εικόνα", icon: ImageIcon },
  { type: "file", label: "Αρχείο", icon: FileUp },
  { type: "link", label: "Σύνδεσμος", icon: Link2 },
  { type: "color", label: "Χρώματα", icon: Palette },
  { type: "checklist", label: "Λίστα", icon: ListChecks },
];

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "#4FB3E3", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#4FB3E3" },
};

function stripNodes(nodes) {
  return nodes.map((n) => {
    const { __token, ...data } = n.data || {};
    return { id: n.id, type: n.type, position: n.position, data, width: n.width, height: n.height };
  });
}

function BoardCanvas({ token, board, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("saved"); // saved | saving | dirty
  const hydrated = useRef(false);
  const wrapRef = useRef(null);
  const saveTimer = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const inject = useCallback(
    (list) => list.map((n) => ({ ...n, data: { ...n.data, __token: token } })),
    [token]
  );

  useEffect(() => {
    let active = true;
    hydrated.current = false;
    setLoading(true);
    (async () => {
      try {
        const res = await axios.get(`${API}/admin/mindmap`, {
          ...authCfg(token),
          params: { owner_type: board.owner_type, owner_id: board.owner_id },
        });
        if (!active) return;
        setNodes(inject(res.data.nodes || []));
        setEdges(res.data.edges || []);
      } finally {
        if (active) {
          setLoading(false);
          setTimeout(() => { hydrated.current = true; }, 60);
        }
      }
    })();
    return () => { active = false; };
  }, [board.owner_type, board.owner_id, token, inject, setNodes, setEdges]);

  // Debounced autosave
  useEffect(() => {
    if (!hydrated.current) return;
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await axios.put(
          `${API}/admin/mindmap`,
          { owner_type: board.owner_type, owner_id: board.owner_id, nodes: stripNodes(nodes), edges },
          authCfg(token)
        );
        setSaveState("saved");
      } catch {
        setSaveState("dirty");
      }
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [nodes, edges, board.owner_type, board.owner_id, token]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onEdgeClick = useCallback((e, edge) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((x) => x.id !== edge.id));
  }, [setEdges]);

  const addNode = useCallback(
    (type) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      const screen = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const position = screenToFlowPosition(screen);
      // small jitter so stacked adds don't perfectly overlap
      position.x += (Math.random() - 0.5) * 80;
      position.y += (Math.random() - 0.5) * 80;
      const node = {
        id: newNodeId(),
        type,
        position,
        data: { ...NODE_DEFAULTS[type], __token: token },
      };
      setNodes((nds) => [...nds, node]);
    },
    [screenToFlowPosition, setNodes, token]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/8 bg-white px-4 py-3">
        <button
          onClick={onBack}
          data-testid="mindmap-back"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3 py-1.5 text-xs font-bold text-ink/60 transition-colors hover:bg-mist"
        >
          <ArrowLeft className="h-3.5 w-3.5" />Πίσω
        </button>
        <div className="mr-auto min-w-0">
          <p className="truncate text-sm font-bold text-ink">{board.name}</p>
          <p className="text-[11px] text-ink/45">
            {board.owner_type === "project" ? "Πίνακας έργου" : "Πίνακας πελάτη"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TOOLS.map((t) => (
            <button
              key={t.type}
              onClick={() => addNode(t.type)}
              data-testid={`mindmap-add-${t.type}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-baby-dark hover:bg-baby-light/40"
            >
              <t.icon className="h-3.5 w-3.5 text-baby-dark" />
              {t.label}
            </button>
          ))}
        </div>
        <div data-testid="mindmap-save-state" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink/45">
          {saveState === "saving" ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Αποθήκευση…</>
          ) : saveState === "dirty" ? (
            <><Cloud className="h-3.5 w-3.5" />Μη αποθηκευμένο</>
          ) : (
            <><Check className="h-3.5 w-3.5 text-emerald-500" />Αποθηκεύτηκε</>
          )}
        </div>
      </div>

      <div ref={wrapRef} className="relative flex-1" data-testid="mindmap-canvas">
        {loading ? (
          <div className="flex h-full items-center justify-center text-ink/40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={defaultEdgeOptions}
            deleteKeyCode={["Delete"]}
            fitView
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#C9D3DE" gap={22} size={1.5} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="#89CFF0" maskColor="rgba(27,36,48,0.06)" />
          </ReactFlow>
        )}
        {!loading && nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-ink/35">
            <Network className="h-10 w-10" />
            <p className="mt-3 font-display text-lg font-medium text-ink/50">Άδειος πίνακας</p>
            <p className="mt-1 text-sm">Πρόσθεσε σημειώσεις, εικόνες & αρχεία από τη γραμμή εργαλείων.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardRow({ title, subtitle, icon: Icon, onOpen, testid }) {
  return (
    <button
      onClick={onOpen}
      data-testid={testid}
      className="group flex w-full items-center gap-3 rounded-2xl border border-ink/8 bg-white px-4 py-3.5 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-baby-light text-baby-dark">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{title}</p>
        {subtitle && <p className="truncate text-xs text-ink/45">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 transition-transform group-hover:translate-x-0.5 group-hover:text-baby-dark" />
    </button>
  );
}

export default function MindMaps({ token }) {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cl, pr] = await Promise.all([
          axios.get(`${API}/admin/clients`, authCfg(token)),
          axios.get(`${API}/admin/projects`, authCfg(token)),
        ]);
        setClients(cl.data);
        setProjects(pr.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const clientName = useMemo(() => {
    const m = new Map(clients.map((c) => [c.id, c.name]));
    return (id) => m.get(id);
  }, [clients]);

  if (board) {
    return (
      <div className="h-[calc(100vh-7rem)] overflow-hidden rounded-[1.5rem] border border-ink/8 bg-mist/30">
        <ReactFlowProvider>
          <BoardCanvas token={token} board={board} onBack={() => setBoard(null)} />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div data-testid="mindmaps-section">
      <SectionHeader
        title="Χάρτες Ιδεών"
        subtitle="Οπτικοί πίνακες (mindmap) για κάθε έργο & πελάτη — inspo, φωτογραφίες, αρχεία, σημειώσεις & παραδοτέα."
      />

      {loading ? (
        <div className="mt-20 flex justify-center text-ink/40"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-ink/40" />
              <h3 className="text-sm font-bold text-ink">Πίνακες Έργων</h3>
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink/50">{projects.length}</span>
            </div>
            <div className="space-y-2.5">
              {projects.length === 0 && (
                <p className="rounded-2xl border border-dashed border-ink/12 px-4 py-8 text-center text-sm text-ink/40">Κανένα έργο ακόμη.</p>
              )}
              {projects.map((p) => (
                <BoardRow
                  key={p.id}
                  testid={`mindmap-open-project-${p.id}`}
                  title={p.name}
                  subtitle={clientName(p.client_id) || "Χωρίς πελάτη"}
                  icon={FolderKanban}
                  onOpen={() => setBoard({
                    owner_type: "project",
                    owner_id: p.id,
                    name: p.name + (clientName(p.client_id) ? ` · ${clientName(p.client_id)}` : ""),
                  })}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-ink/40" />
              <h3 className="text-sm font-bold text-ink">Πίνακες Πελατών</h3>
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink/50">{clients.length}</span>
            </div>
            <div className="space-y-2.5">
              {clients.length === 0 && (
                <p className="rounded-2xl border border-dashed border-ink/12 px-4 py-8 text-center text-sm text-ink/40">Κανένας πελάτης ακόμη.</p>
              )}
              {clients.map((c) => (
                <BoardRow
                  key={c.id}
                  testid={`mindmap-open-client-${c.id}`}
                  title={c.name}
                  subtitle={c.contact_name || c.email || "Γενικός πίνακας πελάτη"}
                  icon={Users}
                  onOpen={() => setBoard({ owner_type: "client", owner_id: c.id, name: c.name })}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback, type DragEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import craneImage from "@/assets/crane.png";
import virgaLogo from "@/assets/virgalogo.png";
import astronautAscii from "@/assets/ascii/astronaut.ascii.png";
import breakingBadAscii from "@/assets/ascii/Breaking_Bad.ascii.png";
import cityAscii from "@/assets/ascii/city.ascii.png";
import davidAscii from "@/assets/ascii/david.ascii.png";
import helloCittyAscii from "@/assets/ascii/hello_citty.ascii.png";
import mountainsAscii from "@/assets/ascii/mountains.ascii.png";
import nissanAscii from "@/assets/ascii/nissan.ascii.png";
import scullAscii from "@/assets/ascii/sсull.ascii.png";
import treeImage from "@/assets/ascii/tree.png";
import waveAscii from "@/assets/ascii/wave.ascii.png";
import {
  Search, Grid3X3, List, Plus, Copy, Type, Image as ImageIcon,
  Film, MoreHorizontal, ChevronDown, X, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import { imageToAsciiFrame, renderFrameToCanvas, DEFAULT_OPTIONS, type ColorMode } from "asciify-engine";

type Page = "home" | "conversion" | "gallery";

type GalleryItem = {
  id: number;
  name: string;
  ext: string;
  w: number;
  h: number;
  size: number;
  time?: string;
  createdAt?: number;
  src?: string;
};

/* ─────────────────────────────────────────
   Matrix background
───────────────────────────────────────── */
const MATRIX_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|<>/\\+-=~`";

function MatrixBackground({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 12;
    let cols = Math.max(1, Math.floor(canvas.offsetWidth / fontSize));
    let drops: number[] = Array(cols).fill(1);
    let rafId = 0;
    let lastTime = 0;
    const frameInterval = 60; // ms between frames (approx previous speed)

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.offsetWidth;
      const cssH = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.floor(cssW / fontSize));
      drops = Array(cols).fill(1);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!visible) {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        return;
      }

      // Lighter overlay for longer trails (restored previous feel)
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
      for (let i = 0; i < drops.length; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillStyle = Math.random() > 0.95 ? "#00ff41" : "#00ff4118";
        const x = i * fontSize + 2;
        const y = drops[i] * fontSize;
        ctx.fillText(char, x, y);

        // If the drop passed the bottom, reset (with small randomness)
        if (y > canvas.offsetHeight) {
          if (Math.random() > 0.975) drops[i] = 0; // rare reset -> longer streams
        }
        drops[i]++;
      }
    };

    const loop = (now: number) => {
      if (!lastTime) lastTime = now;
      const dt = now - lastTime;
      if (dt >= frameInterval) {
        draw();
        lastTime = now;
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [visible]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: visible ? 0.7 : 0, transition: "opacity 0.5s" }}
    />
  );
}

/* ─────────────────────────────────────────
   See History button — rectangular tab
───────────────────────────────────────── */
function SeeHistoryButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.08em",
        padding: "7px 18px",
        background: pressed ? "#222" : "#161616",
        color: "#aaa",
        border: "1px solid #333",
        borderBottom: "1px solid #0a0a0a",
        borderRadius: "4px 4px 0 0",
        transform: pressed ? "translateY(1px)" : "translateY(0)",
        transition: "background 0.1s, transform 0.08s",
        cursor: "pointer",
        marginBottom: "-1px",
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────
   Dark Theme tab — hangs from header
───────────────────────────────────────── */
function DarkThemeButton() {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className="no-scale"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.05em",
        padding: "6px 16px",
        background: pressed ? "#222" : "#161616",
        color: "#666",
        border: "1px solid #2a2a2a",
        borderTop: "none",
        borderRadius: "0 0 6px 6px",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "background 0.1s, transform 0.08s",
        cursor: "pointer",
      }}
    >
      Dark Theme
    </button>
  );
}

/* ─────────────────────────────────────────
   Generic Dropdown
───────────────────────────────────────── */
function Dropdown({
  value,
  options,
  onChange,
  className = "",
  renderOption,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  renderOption?: (opt: string) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1.5 border border-[#2a2a2a] bg-[#111] hover:border-[#444] transition-colors duration-150 active:bg-[#1a1a1a]"
        style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8c8c8", minWidth: "max-content" }}
      >
        {renderOption ? renderOption(value) : value}
        <ChevronDown size={10} className={`ml-1 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 min-w-full border border-[#333] bg-[#0f0f0f]" style={{ marginTop: "2px" }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="flex items-center w-full text-left px-3 py-1.5 hover:bg-[#1f1f1f] transition-colors duration-100"
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: opt === value ? "#00ff41" : "#c8c8c8" }}
            >
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Header
───────────────────────────────────────── */
function Header({ page, onNavigate }: { page: Page; onNavigate: (p: Page, initialAsciiSrc?: string, initialName?: string) => void }) {
  return (
    <header
      className="relative flex items-center justify-between px-5 border-b border-[#111] z-30 flex-shrink-0"
      style={{ height: "40px", background: "#000" }}
    >
      {/* Dark Theme tab — hangs below header */}
      <div className="absolute left-5 top-full z-40">
        <DarkThemeButton />
      </div>

      {/* Logo + breadcrumb */}
      <div className="flex items-center gap-1" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px" }}>
        <button
          onClick={() => onNavigate("home")}
          className="hover:opacity-80 transition-opacity font-bold"
          style={{ color: "#e8315e", letterSpacing: "0.05em" }}
        >
          //.VIRGA
        </button>
        <span style={{ color: "#2a2a2a", margin: "0 4px" }}>//</span>
        <button
          onClick={() => onNavigate("conversion")}
          className="hover:text-[#888] transition-colors"
          style={{ color: "#444", letterSpacing: "0.04em" }}
        >
          ASCII PHOTO &amp; VIDEO GENERATOR
        </button>
        {page === "conversion" && (
          <>
            <span style={{ color: "#2a2a2a", margin: "0 4px" }}>/</span>
            <span style={{ color: "#777" }}>CONVERSION</span>
          </>
        )}
        {page === "gallery" && (
          <>
            <span style={{ color: "#2a2a2a", margin: "0 4px" }}>/</span>
            <span style={{ color: "#777" }}>GALLERY</span>
          </>
        )}
      </div>

      {/* Right action */}
      <div>
        {page === "home" && <SeeHistoryButton label="see history" onClick={() => onNavigate("gallery")} />}
        {page === "conversion" && <SeeHistoryButton label="see history" onClick={() => onNavigate("gallery")} />}
        {page === "gallery" && <SeeHistoryButton label="CONVERSION" onClick={() => onNavigate("conversion")} />}
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════
   PAGE 1 — HOME
══════════════════════════════════════════ */
function HomePage({ onNavigate }: { onNavigate: (p: Page, initialAsciiSrc?: string, initialName?: string) => void }) {
  const [matrixVisible, setMatrixVisible] = useState(true);
  const [matrixBtnPressed, setMatrixBtnPressed] = useState(false);

  return (
    <div className="relative flex-1 overflow-hidden" style={{ background: "#000" }}>
      <MatrixBackground visible={matrixVisible} />

      {/* Matrix toggle — top right */}
      <div className="absolute top-3 right-4 z-20">
        <button
          onMouseDown={() => setMatrixBtnPressed(true)}
          onMouseUp={() => setMatrixBtnPressed(false)}
          onMouseLeave={() => setMatrixBtnPressed(false)}
          onClick={() => setMatrixVisible((v) => !v)}
          title={matrixVisible ? "Выключить матрицу" : "Включить матрицу"}
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.05em",
            padding: "5px 12px",
            background: matrixBtnPressed ? "#1a1a1a" : matrixVisible ? "#0d1a0d" : "#111",
            color: matrixVisible ? "#00ff41" : "#444",
            border: `1px solid ${matrixVisible ? "#00ff4144" : "#2a2a2a"}`,
            borderRadius: "4px",
            transform: matrixBtnPressed ? "scale(0.95)" : "scale(1)",
            transition: "all 0.15s",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {matrixVisible ? <Eye size={11} /> : <EyeOff size={11} />}
          MATRIX
        </button>
      </div>

      {/* Crane image — right */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{ width: "44%", opacity: 0.9 }}
      >
        <ImageWithFallback
          src={craneImage}
          alt="ASCII crane"
          className="w-full h-full object-contain object-right"
        />
      </div>

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col justify-center h-full"
        style={{ paddingLeft: "60px", paddingTop: "70px", maxWidth: "56%" }}
      >
        {/* Tagline */}
        <p
          className="mb-6"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "16px",
            color: "#00ff41",
            letterSpacing: "0.12em",
          }}
        >
          {"< GENERATE. TRANSFORM. INSPIRE />"}
        </p>

        {/* Virga logo image (replaces ASCII art text) */}
        <div className="mb-7" style={{ maxWidth: "520px" }}>
          <ImageWithFallback
            src={virgaLogo}
            alt="VIRGA ASCII logo"
            className="w-full object-contain object-left"
          />
        </div>

        {/* Heading */}
        <h1
          className="mb-5"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "28px",
            color: "#c8c8c8",
            letterSpacing: "0.03em",
            lineHeight: "1.25",
            borderLeft: "4px solid #e8315e",
            paddingLeft: "18px",
          }}
        >
          ГЕНЕРАТОР ФОТО И ВИДЕО<br />В ASCII ART
        </h1>

        {/* Description */}
        <p
          className="mb-10"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "14px",
            color: "#555",
            lineHeight: "1.8",
            maxWidth: "420px",
            paddingLeft: "22px",
          }}
        >
          Преобразуйте изображения и видео в уникальные ASCII-
          произведения. Эстетика символов. Искусство в каждой строке.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center gap-5 mb-10 pl-1">
          <ActionButton label="ПОПРОБОВАТЬ ОНЛАЙН →" variant="primary" onClick={() => onNavigate("conversion")} />
          <ActionButton label="СМОТРЕТЬ ПРИМЕРЫ" variant="secondary" onClick={() => onNavigate("gallery")} />
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-6 pl-1">
          <SocialIcon href="#" title="Telegram">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "28px", height: "28px" }}>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.527l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.646.059z" />
            </svg>
          </SocialIcon>
          <SocialIcon href="#" title="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "28px", height: "28px" }}>
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </SocialIcon>
          <SocialIcon href="#" title="Google">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "28px", height: "28px" }}>
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
            </svg>
          </SocialIcon>
          <SocialIcon href="#" title="Discord">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "28px", height: "28px" }}>
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </SocialIcon>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, variant, onClick }: { label: string; variant: "primary" | "secondary"; onClick?: () => void }) {
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "14px",
        letterSpacing: "0.06em",
        padding: "11px 24px",
        border: isPrimary ? "1px solid #00ff41" : "1px solid #2a2a2a",
        background: isPrimary
          ? pressed ? "#00ff4130" : "transparent"
          : pressed ? "#1e1e1e" : "transparent",
        color: isPrimary ? "#00ff41" : "#666",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "all 0.1s",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SocialIcon({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return (
    <a
      href={href}
      title={title}
      className="text-[#444] hover:text-[#00ff41] transition-colors duration-200 hover:scale-125 inline-block"
      style={{ transition: "color 0.2s, transform 0.2s" }}
    >
      {children}
    </a>
  );
}

/* ══════════════════════════════════════════
   PAGE 2 — CONVERSION
══════════════════════════════════════════ */

const COLOR_OPTIONS = [
  { label: "COLOR",       hex: null       },
  { label: "GREEN",       hex: "#00ff41"  },
  { label: "RED",         hex: "#ff1744"  },
  { label: "BLUE",        hex: "#40c4ff"  },
  { label: "PURPLE",      hex: "#ce93d8"  },
  { label: "MONOCHROME",  hex: "#c8c8c8"  },
  { label: "CUSTOM",      hex: "#ffd740"  },
];

const SWATCHES = [
  { hex: "#ff1744", label: "RED"    },
  { hex: "#00ff41", label: "GREEN"  },
  { hex: "#40c4ff", label: "BLUE"   },
  { hex: "#ce93d8", label: "PURPLE" },
];

function ConversionPage({ onNavigate, onSaveGalleryItem, initialAsciiSrc, initialName }: { onNavigate: (p: Page, initialAsciiSrc?: string, initialName?: string) => void; onSaveGalleryItem: (item: GalleryItem) => void; initialAsciiSrc?: string; initialName?: string; }) {
  const [fileType, setFileType] = useState("ФОТО");
  const [density, setDensity] = useState(100);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [mode, setMode] = useState("MODE");
  const [colorLabel, setColorLabel] = useState("COLOR");
  const [inverted, setInverted] = useState(false);
  const [editingMode, setEditingMode] = useState("PHOTO EDITING");
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [asciiReady, setAsciiReady] = useState(false);
  const [asciiDataUrl, setAsciiDataUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const [invPressed, setInvPressed] = useState(false);

  const activeColor = COLOR_OPTIONS.find((c) => c.label === colorLabel) ?? COLOR_OPTIONS[0];

  useEffect(() => {
    if (!initialAsciiSrc) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = initialAsciiSrc;

    img.onload = () => {
      if (cancelled) return;
      const canvas = outputCanvasRef.current;
      if (!canvas) return;
      const wrapper = canvas.parentElement;
      const rect = wrapper?.getBoundingClientRect();
      const wrapperWidth = rect ? Math.max(240, Math.min(860, Math.floor(rect.width))) : img.width;
      const wrapperHeight = rect ? Math.max(120, Math.floor(rect.height)) : img.height;
      const aspectRatio = img.width / img.height;
      let displayWidth = wrapperWidth;
      let displayHeight = Math.round(displayWidth / aspectRatio);
      if (displayHeight > wrapperHeight) {
        displayHeight = wrapperHeight;
        displayWidth = Math.round(displayHeight * aspectRatio);
      }
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(displayWidth * dpr));
      canvas.height = Math.max(1, Math.floor(displayHeight * dpr));
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.style.background = "transparent";

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      setAsciiDataUrl(initialAsciiSrc);
      setAsciiReady(true);
      setSaveName(initialName ?? "");
      setUrlInput("");
      setUploadedFile(null);
    };

    img.onerror = () => {
      console.error("Failed to load selected gallery image into conversion canvas");
    };

    return () => {
      cancelled = true;
    };
  }, [initialAsciiSrc, initialName]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  }, []);

const handleUpload = async () => {
    if (!uploadedFile && !urlInput) return;

    setProcessing(true);
    setAsciiReady(false);

    try {
      let fileToUpload: File | Blob | null = uploadedFile;

      // Если файла нет, но есть URL, пробуем скачать картинку
      if (!fileToUpload && urlInput) {
        const res = await fetch(urlInput);
        if (!res.ok) throw new Error("Не удалось загрузить изображение по URL");
        fileToUpload = await res.blob();
      }

      if (!fileToUpload) throw new Error("Нет файла для отправки");

      // Формируем данные для бэкенда (соответствует аргументам FastAPI Form(...))
      const formData = new FormData();
      // Имя файла важно передать, чтобы бэкенд смог определить расширение (file.filename)
      formData.append("file", fileToUpload, uploadedFile?.name || "image.jpg");
      formData.append("width", density.toString());
      formData.append("invert", inverted.toString());
      formData.append("mode", "text");

      // Отправляем запрос на бэкенд
      const response = await fetch("/api/v1/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      const asciiText = data.ascii; // Получаем сгенерированный текст от сервера

      // Отрисовка полученного от сервера текста на Canvas
      drawAsciiTextToCanvas(asciiText);

    } catch (error: any) {
      console.error(error);
      alert(error.message); // Для уведомления пользователя об ошибке
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveToGallery = () => {
    if (!asciiReady || !asciiDataUrl) return;
    const fileName = saveName.trim() || `ascii_${Date.now()}.png`;
    const estimatedSize = Math.max(10240, Math.ceil((asciiDataUrl.length - "data:image/png;base64,".length) * 3 / 4));
    const canvas = outputCanvasRef.current;
    const displayWidth = canvas ? Math.round(canvas.width / (window.devicePixelRatio || 1)) : 180;
    const displayHeight = canvas ? Math.round(canvas.height / (window.devicePixelRatio || 1)) : 150;

    onSaveGalleryItem({
      id: Date.now(),
      name: fileName,
      ext: "png",
      w: displayWidth,
      h: displayHeight,
      size: estimatedSize,
      createdAt: Date.now(),
      src: asciiDataUrl,
    });
    setSaveModalOpen(false);
    setSaveName("");
  };

  const handleDownloadPng = () => {
    if (!asciiReady || !asciiDataUrl) return;
    const link = document.createElement("a");
    link.href = asciiDataUrl;
    link.download = `ascii_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const bumpDensity = (dir: 1 | -1) => {
    setDensity((v) => Math.min(200, Math.max(20, v + dir * 20)));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "#000" }}>
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: "36px" }}>
        {/* ── LEFT PANEL ── */}
        <div
          className="flex flex-col overflow-y-auto flex-shrink-0"
          style={{ width: "380px", padding: "24px 24px", borderRight: "1px solid #1e1e1e" }}
        >
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "42px",
              color: "#c8c8c8",
              letterSpacing: "0.06em",
              lineHeight: "1",
              marginBottom: "14px",
            }}
          >
            ЗАГРУЗИТЕ ФАЙЛ
          </h1>

          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#555", lineHeight: "1.65", marginBottom: "16px" }}>
            Преобразуйте изображения и видео в<br />
            уникальные ASCII-произведения.<br />
            Эстетика символов. Искусство в каждой строке.
          </p>

          <div className="mb-4">
            <Dropdown value={fileType} options={["ФОТО", "ВИДЕО", "GIF"]} onChange={setFileType} />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center transition-all duration-200"
            style={{
              border: `1px dashed ${dragging ? "#00ff41" : "#2a2a2a"}`,
              background: dragging ? "#00ff4108" : "#0e0e0e",
              borderRadius: "4px",
              padding: "28px 16px",
              marginBottom: "12px",
              cursor: "pointer",
            }}
          >
            <div style={{ width: "36px", height: "36px", border: "1px solid #333", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", color: "#444" }}>
              <Plus size={18} />
            </div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: uploadedFile ? "#00ff41" : "#555", marginBottom: "10px", textAlign: "center" }}>
              {uploadedFile ? uploadedFile.name : "ПЕРЕТАЩИТЕ ФАЙЛ СЮДА"}
            </p>
            {!uploadedFile && (
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#333", marginBottom: "10px" }}>
                или выберите для выбора
              </p>
            )}
            <SmallButton label="ВЫБРАТЬ ФАЙЛ" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} />
            <input ref={fileInputRef} type="file" accept="image/*,video/*,.gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadedFile(f); }} />
          </div>

          <div className="flex items-center justify-between mb-4" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#333", borderTop: "1px solid #1a1a1a", paddingTop: "8px" }}>
            <span>JPEG, PNG, GIF, MP4, MOV, WEBM</span>
            <span>МАКС. РАЗМЕР: 150MB</span>
          </div>

          <div className="flex items-center gap-2 mb-4" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#333" }}>
            <div className="flex-1 h-px bg-[#1e1e1e]" />
            <span>или</span>
            <div className="flex-1 h-px bg-[#1e1e1e]" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Вставьте ссылку на файл (URL)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[#0e0e0e] border border-[#222] focus:border-[#444] focus:outline-none transition-colors"
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#888" }}
            />
            <SmallButton label="ЗАГРУЗИТЬ" onClick={handleUpload} accent />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: "16px 20px" }}>
          {/* Controls row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Density stepper */}
            <div className="flex items-center border border-[#2a2a2a] bg-[#111]" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px" }}>
              <button className="px-2.5 py-1.5 hover:bg-[#1a1a1a] active:bg-[#222] text-[#555] transition-colors" onClick={() => bumpDensity(-1)}>−</button>
              <span className="w-10 text-center text-[#c8c8c8]">{density}</span>
              <button className="px-2.5 py-1.5 hover:bg-[#1a1a1a] active:bg-[#222] text-[#555] transition-colors" onClick={() => bumpDensity(1)}>+</button>
            </div>

            <Dropdown value={mode} options={["MODE", "GRAYSCALE", "BRAILLE", "BLOCKS", "EXTENDED"]} onChange={setMode} />

            {/* INV toggle button */}
            <button
              onMouseDown={() => setInvPressed(true)}
              onMouseUp={() => setInvPressed(false)}
              onMouseLeave={() => setInvPressed(false)}
              onClick={() => setInverted((v) => !v)}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.06em",
                padding: "6px 14px",
                border: `1px solid ${inverted ? "#00ff41" : "#2a2a2a"}`,
                background: inverted ? "#00ff4120" : invPressed ? "#1a1a1a" : "#111",
                color: inverted ? "#00ff41" : "#888",
                transform: invPressed ? "scale(0.94)" : "scale(1)",
                transition: "all 0.1s",
                cursor: "pointer",
              }}
            >
              INV{inverted ? " ✓" : ""}
            </button>

            {/* Color dropdown with preview */}
            <Dropdown
              value={colorLabel}
              options={COLOR_OPTIONS.map((c) => c.label)}
              onChange={setColorLabel}
              renderOption={(opt) => {
                const c = COLOR_OPTIONS.find((x) => x.label === opt);
                return (
                  <span className="flex items-center gap-2">
                    {c?.hex ? (
                      <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: c.hex, display: "inline-block", border: "1px solid #333", flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "linear-gradient(135deg,#ff1744,#00ff41,#40c4ff)", display: "inline-block", border: "1px solid #333", flexShrink: 0 }} />
                    )}
                    {opt}
                  </span>
                );
              }}
            />

            {/* Active color swatches — show which is active */}
            <div className="flex items-center gap-1">
              {SWATCHES.map((s) => {
                const isActive = colorLabel === s.label;
                return (
                  <button
                    key={s.hex}
                    onClick={() => setColorLabel(s.label)}
                    title={s.label}
                    className="transition-all duration-150 hover:scale-110 active:scale-90"
                    style={{
                      width: "18px",
                      height: "18px",
                      background: s.hex,
                      border: isActive ? "2px solid #fff" : "1px solid #333",
                      outline: isActive ? `2px solid ${s.hex}44` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                );
              })}
            </div>

            {/* Current color indicator */}
            {activeColor.hex && (
              <span
                className="flex items-center gap-1.5 px-2 py-1 border border-[#1e1e1e]"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: activeColor.hex }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: activeColor.hex, display: "inline-block" }} />
                {activeColor.label}
              </span>
            )}

            <div className="flex-1" />
            <button className="text-[#333] hover:text-[#555] transition-colors active:text-[#00ff41]" title="Reset">
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Photo editing row */}
          <div className="flex justify-end mb-3">
            <Dropdown value={editingMode} options={["PHOTO EDITING", "BRIGHTNESS", "CONTRAST", "SHARPEN", "BLUR", "INVERT"]} onChange={setEditingMode} />
          </div>

          {/* Preview area */}
          <div className="flex-1 relative border border-[#1e1e1e] overflow-hidden" style={{ background: "transparent", minHeight: "200px" }}>
            <canvas
              ref={outputCanvasRef}
              className="absolute"
              style={{
                display: asciiReady || processing ? "block" : "none",
                background: "transparent",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            {!asciiReady && !processing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", color: "#2a2a2a", letterSpacing: "0.05em" }}>
                  ЗДЕСЬ ОТОБРАЗИТСЯ ВАШ ASCII...
                </p>
              </div>
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", color: "#c8c8c8", letterSpacing: "0.05em" }}>
                  ОБРАБОТКА...
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {[
              { label: "КОПИЯ",   icon: <Copy size={11} />,        action: () => { if (asciiReady && asciiDataUrl) navigator.clipboard.writeText(asciiDataUrl); } },
              { label: "ТЕКСТ",   icon: <Type size={11} /> },
              { label: "PNG",     icon: <ImageIcon size={11} />, action: handleDownloadPng },
              { label: "GIF",     icon: <Film size={11} /> },
              { label: "ВИДЕО",   icon: <Film size={11} /> },
              { label: "ПРОЧЕЕ",  icon: <MoreHorizontal size={11} /> },
              { label: "ГАЛЕРЕЯ", icon: <Grid3X3 size={11} />,     action: () => onNavigate("gallery") },
            ].map(({ label, icon, action }) => (
              <BottomActionButton key={label} label={label} icon={icon} onClick={action} />
            ))}
            <button
              onClick={() => setSaveModalOpen(true)}
              disabled={!asciiReady}
              className="flex items-center gap-1.5 px-3 py-1.5 no-scale border text-[#c8c8c8] hover:border-[#444] transition-colors flex-shrink-0"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.05em",
                borderColor: asciiReady ? "#00ff41" : "#222",
                background: asciiReady ? "#00ff4122" : "#111",
                color: asciiReady ? "#00ff41" : "#444",
                cursor: asciiReady ? "pointer" : "not-allowed",
              }}
            >
              <Plus size={11} />
              СОХРАНИТЬ В ГАЛЕРЕЮ
            </button>
          </div>
          {isSaveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-sm rounded-xl border border-[#222] bg-[#0c0c0c] p-5">
                <h2 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color: "#c8c8c8", marginBottom: "10px" }}>
                  СОХРАНИТЬ В ГАЛЕРЕЮ
                </h2>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#888", lineHeight: "1.6", marginBottom: "14px" }}>
                  Введите имя файла, чтобы сохранить текущий результат в галерее.
                </p>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Имя файла.ascii"
                  className="w-full bg-[#111] border border-[#222] px-3 py-2 text-[#c8c8c8] focus:outline-none"
                  style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setSaveModalOpen(false)}
                    className="px-3 py-2 border border-[#222] text-[#888] hover:border-[#444] hover:text-[#c8c8c8] transition-colors"
                    style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
                  >
                    ОТМЕНА
                  </button>
                  <button
                    onClick={handleSaveToGallery}
                    className="px-3 py-2 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff4122] transition-all"
                    style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
                  >
                    СОХРАНИТЬ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallButton({ label, onClick, accent = false }: { label: string; onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void; accent?: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.06em",
        padding: "5px 12px",
        border: `1px solid ${accent ? "#444" : "#333"}`,
        background: pressed ? "#222" : "#111",
        color: accent ? "#c8c8c8" : "#888",
        transform: pressed ? "scale(0.95)" : "scale(1)",
        transition: "all 0.1s",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function BottomActionButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick?: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      className="flex items-center gap-1.5 hover:border-[#444] hover:text-[#c8c8c8] transition-all duration-100"
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.06em",
        padding: "6px 14px",
        border: "1px solid #222",
        background: pressed ? "#1a1a1a" : "#0d0d0d",
        color: "#666",
        transform: pressed ? "scale(0.94)" : "scale(1)",
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════
   PAGE 3 — GALLERY
══════════════════════════════════════════ */
const now = Date.now();
const GALLERY_ITEMS = [
  { id: 1,  name: "astronaut.ascii.png",     ext: "png", w: 120, h: 120, size: 94203,  createdAt: now, time: "just now", src: astronautAscii },
  { id: 2,  name: "Breaking_Bad.ascii.png",  ext: "png", w: 120, h: 120, size: 191205, createdAt: now, time: "just now", src: breakingBadAscii },
  { id: 3,  name: "city.ascii.png",          ext: "png", w: 120, h: 120, size: 101827, createdAt: now, time: "just now", src: cityAscii },
  { id: 4,  name: "david.ascii.png",         ext: "png", w: 120, h: 120, size: 132737, createdAt: now, time: "just now", src: davidAscii },
  { id: 5,  name: "hello_citty.ascii.png",   ext: "png", w: 120, h: 120, size: 630969, createdAt: now, time: "just now", src: helloCittyAscii },
  { id: 7,  name: "mountains.ascii.png",     ext: "png", w: 120, h: 120, size: 177356, createdAt: now, time: "just now", src: mountainsAscii },
  { id: 8,  name: "nissan.ascii.png",        ext: "png", w: 120, h: 120, size: 899916, createdAt: now, time: "just now", src: nissanAscii },
  { id: 9,  name: "sсull.ascii.png",         ext: "png", w: 120, h: 120, size: 155662, createdAt: now, time: "just now", src: scullAscii },
  { id: 10, name: "tree.png",                ext: "png", w: 120, h: 120, size: 119579, createdAt: now, time: "just now", src: treeImage },
  { id: 11, name: "wave.ascii.png",          ext: "png", w: 120, h: 120, size: 205612, createdAt: now, time: "just now", src: waveAscii },
];

function parseSavedCreatedAt(item: GalleryItem): number | undefined {
  if (typeof item.createdAt === "number") return item.createdAt;
  if (typeof item.createdAt === "string") {
    const parsed = Number(item.createdAt);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (!item.time) return undefined;
  const normalized = item.time.trim().toLowerCase();
  if (normalized === "just now") return Date.now();
  const match = normalized.match(/^(\d+)\s+(min|mins|hour|hours|day|days)\s+ago$/);
  if (!match) return Date.now();
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case "min":
    case "mins":
      return Date.now() - value * 60_000;
    case "hour":
    case "hours":
      return Date.now() - value * 60 * 60_000;
    case "day":
    case "days":
      return Date.now() - value * 24 * 60 * 60_000;
    default:
      return Date.now();
  }
}

function formatTimeAgo(createdAt?: number, fallback = "just now") {
  if (!createdAt) return fallback;
  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function GalleryPage({ onNavigate, items, onDeleteItem, onSelectItem }: { onNavigate: (p: Page, initialAsciiSrc?: string, initialName?: string) => void; items: GalleryItem[]; onDeleteItem?: (id: number) => void; onSelectItem?: (item: GalleryItem) => void }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE (NEWEST)");
  const [search, setSearch] = useState("");
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const totalFiles = items.length;
  const imageFiles = items.filter((item) => item.ext === "png").length;
  const gifFiles = items.filter((item) => item.ext === "gif").length;
  const videoFiles = items.filter((item) => item.ext === "mp4").length;
  const storageUsed = items.reduce((sum, item) => sum + (item.size ?? 0), 0);

  const filtered = items.filter((item) => {
    const ms = item.name.toLowerCase().includes(search.toLowerCase());
    const mt = filterType === "ALL" || (filterType === "IMAGE" && item.ext === "png") || (filterType === "GIF" && item.ext === "gif") || (filterType === "VIDEO" && item.ext === "mp4");
    return ms && mt;
  });

  return (
    <div className="flex-1 flex overflow-hidden relative" style={{ background: "#000" }}>
      {/* ── LEFT SIDEBAR ── */}
      <div
        className="flex flex-col overflow-y-auto flex-shrink-0"
        style={{ width: "280px", padding: "44px 22px 14px", borderRight: "1px solid #1e1e1e" }}
      >
        <GSection title="GALLERY_STATS">
          {[
            ["TOTAL FILES", String(totalFiles)],
            ["IMAGES", String(imageFiles)],
            ["VIDEOS", String(videoFiles)],
            ["GIFS", String(gifFiles)],
            ["STORAGE USED", formatFileSize(storageUsed)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444" }}>{k}</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#666" }}>{v}</span>
            </div>
          ))}
        </GSection>

        <DottedDivider />

        <GSection title="FILTERS">
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", marginBottom: "6px" }}>TYPE</p>
          {["ALL","IMAGE","GIF","VIDEO"].map((t) => (
            <label key={t} className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
              <div
                onClick={() => setFilterType(t)}
                className="w-3 h-3 border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ borderColor: filterType === t ? "#00ff41" : "#333", background: filterType === t ? "#00ff4122" : "transparent", borderRadius: "50%" }}
              >
                {filterType === t && <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41]" />}
              </div>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: filterType === t ? "#00ff41" : "#555" }}>{t}</span>
            </label>
          ))}

          {/* color filter removed */}

          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", marginBottom: "6px" }}>SORT BY</p>
          <Dropdown
            value={sortBy}
            options={["DATE (NEWEST)","DATE (OLDEST)","NAME (A-Z)","NAME (Z-A)","SIZE"]}
            onChange={setSortBy}
            className="w-full mb-3"
          />

          <button
            onClick={() => { setFilterType("ALL"); setSortBy("DATE (NEWEST)"); }}
            className="w-full text-center py-1 hover:border-[#555] hover:text-[#888] transition-colors active:bg-[#1a1a1a]"
            style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", border: "1px solid #222", letterSpacing: "0.05em", marginBottom: "10px" }}
          >
            CLEAR FILTERS
          </button>
        </GSection>

        <DottedDivider />

        <button
          className="text-left hover:opacity-80 transition-opacity active:opacity-60"
          style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#00ff41", letterSpacing: "0.05em" }}
        >
          {">"} LOAD MORE
        </button>
      </div>

      {/* ── MAIN GALLERY ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: "44px 16px 16px" }}>
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="flex border border-[#1e1e1e] rounded-md overflow-hidden flex-1 bg-[#0d0d0d]">
            <div className="flex items-center gap-2 flex-1 px-3 py-1.5 hover:border-[#333] transition-colors focus-within:border-[#444]">
              <Search size={12} className="text-[#333] flex-shrink-0" />
              <input
              type="text"
              placeholder="SEARCH GALLERY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none"
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#888" }}
            />
            {search && <button onClick={() => setSearch("")} className="text-[#333] hover:text-[#666]"><X size={11} /></button>}
          </div>
          </div>

          <div className="flex border border-[#1e1e1e] rounded-full overflow-hidden">
            {(["grid","list"] as const).map((v, index) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-3 py-1.5 transition-colors active:bg-[#222] first:rounded-l-full last:rounded-r-full"
                style={{
                  background: viewMode === v ? "#1a1a1a" : "transparent",
                  color: viewMode === v ? "#00ff41" : "#444",
                  borderRight: v === "grid" ? "1px solid #1e1e1e" : "none",
                }}
              >
                {v === "grid" ? <Grid3X3 size={13} /> : <List size={13} />}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate("conversion")}
            className="flex items-center gap-1.5 px-3 py-1.5 no-scale border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff4111] active:bg-[#00ff4122] transition-colors flex-shrink-0"
            style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", letterSpacing: "0.05em" }}
          >
            <Plus size={11} />
            NEW CONVERSION
          </button>
        </div>

        {/* Gallery grid — paddingTop ensures hover lift doesn't clip */}
        {viewMode === "grid" ? (
          <div
            className="flex-1 overflow-y-auto"
            style={{ paddingTop: "6px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "18px",
                alignContent: "start",
              }}
            >
              {filtered.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  onDelete={() => onDeleteItem?.(item.id)}
                  onClick={() => onSelectItem?.(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["NAME","SIZE","TYPE","UPLOADED"].map((col) => (
                    <th key={col} className="text-left pb-2" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "0.05em", padding: "0 8px 8px 0" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#0e0e0e] transition-colors"
                    style={{ borderBottom: "1px solid #111", cursor: onSelectItem ? "pointer" : "auto" }}
                    onClick={() => onSelectItem?.(item)}
                  >
                    <td className="py-2 pr-8" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#888" }}>{item.name}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>{item.w}x{item.h}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>{item.ext}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>{formatTimeAgo(item.createdAt, item.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryCard({ item, onDelete, onClick }: { item: GalleryItem; onDelete?: () => void; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="cursor-pointer relative"
      style={{
        border: `1px solid ${hovered ? "#3a3a3a" : "#1e1e1e"}`,
        background: "#0d0d0d",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: hovered ? "0 6px 20px rgba(0,0,0,0.6)" : "none",
      }}
    >
      {/* ╔══════════════════════════════════════════╗
          ║  IMAGE PLACEHOLDER — item #{item.id}     ║
          ║  Замените этот блок на:                  ║
          ║                                          ║
          ║  import img{item.id} from "@/assets/…"  ║
          ║                                          ║
          ║  <ImageWithFallback                      ║
          ║    src={img{item.id}}                    ║
          ║    alt="{item.name}"                     ║
          ║    className="w-full h-full object-cover"║
          ║  />                                      ║
          ╚══════════════════════════════════════════╝ */}<div style={{ height: "210px", background: "#111", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "6px", position: "relative" }}>
        {item.src ? (
          <ImageWithFallback
            src={item.src}
            alt={item.name}
            className="object-contain"
            style={{ width: "98%", height: "98%" }}
          />
        ) : (
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#222", textAlign: "center", lineHeight: "1.5" }}>
            IMAGE<br />PLACEHOLDER<br />#{item.id}
          </span>
        )}
        {hovered && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute bottom-1 right-1"
            title="Delete"
            style={{
              width: "24px",
              height: "24px",
              background: "#ff1744",
              border: "none",
              borderRadius: "3px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = "#ff5252";
              (e.target as HTMLButtonElement).style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "#ff1744";
              (e.target as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            ×
          </button>
        )}
      </div>

      <div className="p-2">
        <p className="truncate mb-0.5" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: hovered ? "#00ff41" : "#666", transition: "color 0.15s" }}>
          {item.name}
        </p>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", color: "#333" }}>
          {item.ext} {item.w}x{item.h}
        </p>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", color: "#2a2a2a" }}>
          {formatTimeAgo(item.createdAt, item.time)}
        </p>
      </div>
    </div>
  );
}

function GSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-2" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#00ff41", letterSpacing: "0.08em" }}>{title}</p>
      {children}
    </div>
  );
}

function DottedDivider() {
  return <div className="my-3" style={{ borderTop: "1px dashed #1e1e1e" }} />;
}

/* ══════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════ */
const GALLERY_ASSET_MAP: Record<string, string> = {
  "astronaut.ascii.png": astronautAscii,
  "Breaking_Bad.ascii.png": breakingBadAscii,
  "city.ascii.png": cityAscii,
  "david.ascii.png": davidAscii,
  "hello_citty.ascii.png": helloCittyAscii,
  "mountains.ascii.png": mountainsAscii,
  "nissan.ascii.png": nissanAscii,
  "sсull.ascii.png": scullAscii,
  "tree.png": treeImage,
  "wave.ascii.png": waveAscii,
};

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [selectedGallerySrc, setSelectedGallerySrc] = useState<string | undefined>(undefined);
  const [selectedGalleryName, setSelectedGalleryName] = useState<string | undefined>(undefined);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    if (typeof window === "undefined") return GALLERY_ITEMS;
    try {
      const raw = window.localStorage.getItem("virgo_gallery");
      if (!raw) return GALLERY_ITEMS;
      const items = JSON.parse(raw) as GalleryItem[];
      if (!Array.isArray(items)) return GALLERY_ITEMS;
      return items.map((item) => ({
        ...item,
        createdAt: item.createdAt ?? parseSavedCreatedAt(item),
        src: item.src ?? GALLERY_ASSET_MAP[item.name],
      }));
    } catch {
      return GALLERY_ITEMS;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("virgo_gallery", JSON.stringify(galleryItems));
    } catch {
      try {
        const raw = encodeURIComponent(JSON.stringify(galleryItems));
        document.cookie = `virgo_gallery=${raw}; path=/; max-age=${60 * 60 * 24 * 30}`;
      } catch {
        // ignore persistence failure
      }
    }
  }, [galleryItems]);

  const handleSaveGalleryItem = (item: GalleryItem) => {
    setGalleryItems((prev) => [item, ...prev]);
  };

  const handleNavigate = (target: Page, initialAsciiSrc?: string, initialName?: string) => {
    setPage(target);
    if (target === "conversion") {
      setSelectedGallerySrc(initialAsciiSrc);
      setSelectedGalleryName(initialName);
    } else {
      setSelectedGallerySrc(undefined);
      setSelectedGalleryName(undefined);
    }
  };

  return (
    <div className="app-root flex flex-col" style={{ height: "100vh", overflow: "hidden", background: "#000" }}>
      <Header page={page} onNavigate={handleNavigate} />
      {page === "home" && <HomePage onNavigate={handleNavigate} />}
      {page === "conversion" && (
        <ConversionPage
          onNavigate={handleNavigate}
          onSaveGalleryItem={handleSaveGalleryItem}
          initialAsciiSrc={selectedGallerySrc}
          initialName={selectedGalleryName}
        />
      )}
      {page === "gallery" && (
        <GalleryPage
          onNavigate={handleNavigate}
          items={galleryItems}
          onDeleteItem={(id) => setGalleryItems((prev) => prev.filter((i) => i.id !== id))}
          onSelectItem={(item) => handleNavigate("conversion", item.src, item.name)}
        />
      )}
    </div>
  );
}

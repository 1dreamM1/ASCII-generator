import { useState, useRef, useEffect, useCallback, useMemo, type DragEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import craneImage from "@/imports/crane.png";
import virgaLogo from "@/imports/virgalogo.png";
import astronautAscii from "@/ascii/astronaut.ascii.png";
import breakingBadAscii from "@/ascii/Breaking_Bad.ascii.png";
import cityAscii from "@/ascii/city.ascii.png";
import davidAscii from "@/ascii/david.ascii.png";
import helloCittyAscii from "@/ascii/hello_citty.ascii.png";
import mountainsAscii from "@/ascii/mountains.ascii.png";
import nissanAscii from "@/ascii/nissan.ascii.png";
import scullAscii from "@/ascii/sсull.ascii.png";
import treeImage from "@/ascii/tree.png";
import waveAscii from "@/ascii/wave.ascii.png";
import {
  Search, Grid3X3, List, Plus, Copy, Type, Image as ImageIcon,
  Film, MoreHorizontal, ChevronDown, X, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import { asciifyVideo, imageToAsciiFrame, renderFrameToCanvas, DEFAULT_OPTIONS, CHARSETS, type ColorMode } from "asciify-engine";
// @ts-ignore
import GIF from "gif.js";

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
  /** Optional original source image (data URL) saved alongside the processed asset */
  originalSrc?: string;
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
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const fontSize = 12;
    let cols = Math.max(1, Math.floor(canvas.offsetWidth / fontSize));
    let drops: number[] = Array(cols).fill(1);
    let rafId = 0;
    let lastTime = 0;
    const frameInterval = 60; // ms between frames (approx previous speed)

    let speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.6);

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
      speeds = Array(cols).fill(0).map(() => Math.random() * 0.35 + 0.45);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!visible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
      for (let i = 0; i < cols; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const x = i * fontSize + 2;
        const y = drops[i] * fontSize;

        ctx.fillStyle = Math.random() > 0.96 ? "#d0ffd0" : "rgba(0,255,65,0.35)";
        ctx.fillText(char, x, y);

        drops[i] += speeds[i];
        if (y > height + fontSize * 2) {
          drops[i] = 1;
          speeds[i] = Math.random() * 0.25 + 0.35;
        }
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
// DarkThemeButton removed

/* ─────────────────────────────────────────
   Generic Dropdown
───────────────────────────────────────── */
function Dropdown({
  value,
  buttonLabel,
  options,
  onChange,
  onOptionContextMenu,
  className = "",
  renderOption,
}: {
  value: string;
  buttonLabel?: string;
  options: string[];
  onChange: (v: string) => void;
  onOptionContextMenu?: (opt: string, event: React.MouseEvent<HTMLButtonElement>) => void;
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
        {renderOption ? renderOption(buttonLabel ?? value) : buttonLabel ?? value}
        <ChevronDown size={10} className={`ml-1 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 min-w-full border border-[#333] bg-[#0f0f0f]" style={{ marginTop: "2px" }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              onContextMenu={(e) => {
                if (onOptionContextMenu) onOptionContextMenu(opt, e);
              }}
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
      {/* Dark Theme removed */}

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
  { label: "BLACK & WHITE", hex: null },
  { label: "COLOR",         hex: null },
  { label: "GREEN",         hex: "#00ff41" },
  { label: "RED",           hex: "#ff1744" },
  { label: "BLUE",          hex: "#40c4ff" },
  { label: "PURPLE",        hex: "#ce93d8" },
  { label: "MONOCHROME",    hex: "#c8c8c8" },
  { label: "CUSTOM",        hex: "#ffd740" },
];

const SWATCHES = [
  { hex: "#ff1744", label: "RED"    },
  { hex: "#00ff41", label: "GREEN"  },
  { hex: "#40c4ff", label: "BLUE"   },
  { hex: "#ce93d8", label: "PURPLE" },
];

function ConversionPage({ onNavigate, onSaveGalleryItem, initialAsciiSrc, initialName }: { onNavigate: (p: Page, initialAsciiSrc?: string, initialName?: string) => void; onSaveGalleryItem: (item: GalleryItem) => void; initialAsciiSrc?: string; initialName?: string; }) {
  const [density, setDensity] = useState(100);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [mode, setMode] = useState("GRAYSCALE");
  const [colorLabel, setColorLabel] = useState("COLOR");
  const [inverted, setInverted] = useState(false);
  const [isAddModeOpen, setAddModeOpen] = useState(false);
  const [newModeName, setNewModeName] = useState("");
  const [newCharset, setNewCharset] = useState(DEFAULT_OPTIONS.charset);
  const [customModes, setCustomModes] = useState<{ label: string; charset: string }[]>([]);
  const [editingModeLabel, setEditingModeLabel] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState("PHOTO EDITING");
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentSource, setCurrentSource] = useState<string | undefined>(undefined);
  const [currentSourceFile, setCurrentSourceFile] = useState<File | null>(null);
  const [currentSourceName, setCurrentSourceName] = useState("");
  const [restoreState, setRestoreState] = useState<{ source: string; file: File | null; name: string; urlInput: string } | null>(null);
  const [asciiReady, setAsciiReady] = useState(false);
  const [asciiDataUrl, setAsciiDataUrl] = useState("");
  const [asciiText, setAsciiText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [monoColor, setMonoColor] = useState(false);
  const videoRenderStopRef = useRef<(() => void) | null>(null);
  const [customColor, setCustomColor] = useState("#ffd740");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [blur, setBlur] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [invertAmount, setInvertAmount] = useState(0);
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorY, setMirrorY] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const currentVideoDurationRef = useRef<number | null>(null);
  const maxCanvasSizeRef = useRef<{ width: number; height: number } | null>(null);
  const cachedImageRef = useRef<{ src: string; img: HTMLImageElement } | null>(null);
  const renderRequestIdRef = useRef(0);
  const renderTimerRef = useRef<number | null>(null);
  const [invPressed, setInvPressed] = useState(false);
  // Refs for storing processed outputs
  const gifBlobRef = useRef<Blob | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);
  const processingVideoRef = useRef(false);

  const activeColor = useMemo(() => {
    if (colorLabel === "CUSTOM") {
      return { label: "CUSTOM", hex: customColor };
    }
    return COLOR_OPTIONS.find((c) => c.label === colorLabel) ?? COLOR_OPTIONS[0];
  }, [colorLabel, customColor]);

  useEffect(() => {
    if (!initialAsciiSrc) return;
    maxCanvasSizeRef.current = null;
    setCurrentSource(initialAsciiSrc);
    setCurrentSourceFile(null);
    setCurrentSourceName(initialName ?? "gallery-image.png");
    setSaveName(initialName ?? "");
    setUrlInput("");
    setUploadedFile(null);
  }, [initialAsciiSrc, initialName]);

  const resetPhotoSettings = () => {
    setBrightness(100);
    setContrast(100);
    setBlur(0);
    setSharpen(0);
    setInvertAmount(0);
    setInverted(false);
    setMonoColor(false);
    setColorLabel("COLOR");
    setMirrorX(false);
    setMirrorY(false);
    setEditingMode("PHOTO EDITING");
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setUploadedFile(file);
    setCurrentSourceName(file.name);
    setCurrentSourceFile(file);
    maxCanvasSizeRef.current = null;
    const source = URL.createObjectURL(file);
    if (currentBlobUrlRef.current && currentBlobUrlRef.current !== source && currentBlobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }
    currentBlobUrlRef.current = source;
    setCurrentSource(source);
  }, [setCurrentSource, currentBlobUrlRef]);

  const stopAsciiVideo = useCallback(() => {
    if (videoRenderStopRef.current) {
      videoRenderStopRef.current();
      videoRenderStopRef.current = null;
    }
  }, []);

  const loadImage = useCallback(async (source: string) => {
    const cached = cachedImageRef.current;
    if (cached?.src === source) {
      return cached.img;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = source;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    });

    cachedImageRef.current = { src: source, img };
    return img;
  }, []);

  const stopPendingRender = useCallback(() => {
    if (renderTimerRef.current) {
      window.clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
    }
    renderRequestIdRef.current += 1;
  }, []);

  const isVideoSourceFile = useCallback((source: string, file?: File) => {
    if (file?.type.startsWith("video/")) return true;
    return /\.(mp4|mov|webm|ogv|ogg)$/i.test(source);
  }, []);

  const loadVideoMetadata = useCallback(async (source: string) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = source;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Не удалось загрузить видео для метаданных"));
    });
    return video.duration || null;
  }, []);

  const renderVideoSource = useCallback(async (source: string, file?: File) => {
    setProcessing(true);
    setAsciiReady(false);
    gifBlobRef.current = null;
    videoBlobRef.current = null;
    const currentRequestId = ++renderRequestIdRef.current;
    processingVideoRef.current = true;

    try {
      currentVideoDurationRef.current = await loadVideoMetadata(source).catch(() => null);

      const canvas = outputCanvasRef.current;
      if (!canvas) return;

      const charSpacing = 1;
      const charAspect = 0.55;
      const targetCols = Math.max(1, density);
      const fontSize = Math.floor(Math.max(240, Math.min(860, canvas.parentElement?.getBoundingClientRect().width ?? 640)) / targetCols / charSpacing);
      const safeFontSize = Math.max(1, fontSize);

      const selectedCharset = (() => {
        switch (mode) {
          case "GRAYSCALE":
            return DEFAULT_OPTIONS.charset;
          case "BRAILLE":
            return CHARSETS.braille;
          case "BLOCKS":
            return CHARSETS.blocks;
          case "EXTENDED":
            return CHARSETS.ascii;
          default: {
            const custom = customModes.find((item) => item.label === mode);
            return custom?.charset ?? DEFAULT_OPTIONS.charset;
          }
        }
      })();

      const useGrayscale = mode === "GRAYSCALE" || activeColor.label === "BLACK & WHITE";
      const colorMode: ColorMode = useGrayscale ? "grayscale" : "fullcolor";
      const opts = {
        ...DEFAULT_OPTIONS,
        fontSize: safeFontSize,
        charSpacing,
        charAspect,
        charset: selectedCharset,
        colorMode,
        brightness: Math.max(-1, Math.min(1, (brightness - 100) / 100)),
        contrast: Math.max(-1, Math.min(1, (contrast - 100) / 100)),
        invert: inverted,
        hoverStrength: 0,
        renderMode: "ascii" as const,
      };

      stopAsciiVideo();

      // Prepare for video and GIF recording
      const capturedFrames: ImageData[] = [];
      const frameTimestamps: number[] = [];
      let lastFrameTime = 0;
      const videoChunks: Blob[] = [];

      // Start canvas recording for video
      const stream = canvas.captureStream(30);
      let mediaRecorder: MediaRecorder | null = null;

      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp8,opus",
          videoBitsPerSecond: 2500000,
        });
      } catch {
        // Fallback to default codec
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunks.push(e.data);
      };

      mediaRecorder.start();

      let started = false;
      let frameCount = 0;

      const stop = await asciifyVideo(source, canvas, {
        fitTo: canvas.parentElement ?? undefined,
        options: opts,
        onReady: () => {
          if (currentRequestId !== renderRequestIdRef.current) return;
          if (!started) {
            started = true;
            // Don't set ready yet - wait for processing to complete
          }
        },
        onFrame: () => {
          if (currentRequestId !== renderRequestIdRef.current) return;
          
          frameCount++;

          // Capture frame for GIF (at most 30 FPS)
          const now = performance.now();
          if (now - lastFrameTime > 33) {
            try {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                capturedFrames.push(imageData);
                frameTimestamps.push(now);
                lastFrameTime = now;

                // Limit to 300 frames
                if (capturedFrames.length > 300) {
                  capturedFrames.shift();
                  frameTimestamps.shift();
                }
              }
            } catch (error) {
              console.error("Error capturing frame:", error);
            }
          }

          if (!started) {
            started = true;
          }
        },
      });

      if (currentRequestId !== renderRequestIdRef.current) {
        stop();
        mediaRecorder?.stop();
        return;
      }

      videoRenderStopRef.current = stop;

      // Wait for video to complete
      const videoDuration = currentVideoDurationRef.current || 5;
      await new Promise(resolve => setTimeout(resolve, (videoDuration + 0.5) * 1000));

      // Stop video recording
      mediaRecorder.onstop = async () => {
        if (currentRequestId === renderRequestIdRef.current && videoChunks.length > 0) {
          const videoBlob = new Blob(videoChunks, { type: "video/webm" });
          videoBlobRef.current = videoBlob;
        }
      };

      mediaRecorder.stop();

      // Create GIF from captured frames
      if (capturedFrames.length > 0 && currentRequestId === renderRequestIdRef.current) {
        try {
          const gif = new GIF({
            workers: 2,
            quality: 10,
            width: capturedFrames[0]?.width || 640,
            height: capturedFrames[0]?.height || 480,
            workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
          });

          capturedFrames.forEach((frame, index) => {
            const gifCanvas = document.createElement("canvas");
            gifCanvas.width = frame.width;
            gifCanvas.height = frame.height;
            const ctx = gifCanvas.getContext("2d");
            if (ctx) {
              ctx.putImageData(frame, 0, 0);
            }
            const delay = index < frameTimestamps.length - 1
              ? Math.max(33, frameTimestamps[index + 1] - frameTimestamps[index])
              : 33;
            gif.addFrame(gifCanvas, { delay });
          });

          gif.on("finished", (blob: Blob) => {
            if (currentRequestId === renderRequestIdRef.current) {
              gifBlobRef.current = blob;
            }
          });

          gif.render();
        } catch (error) {
          console.error("Error creating GIF:", error);
        }
      }

      if (file && currentRequestId === renderRequestIdRef.current) {
        setUploadedFile(file);
      }

      // Show ready with a small delay to ensure files are ready
      setTimeout(() => {
        if (currentRequestId === renderRequestIdRef.current) {
          setAsciiReady(true);
          setProcessing(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Error processing video:", error);
      setProcessing(false);
    } finally {
      processingVideoRef.current = false;
    }
  }, [activeColor.label, brightness, contrast, customModes, density, inverted, mode, stopAsciiVideo]);

  const renderImageSource = useCallback(async (source: string, file?: File) => {
    stopAsciiVideo();
    setProcessing(true);
    setAsciiReady(false);
    const currentRequestId = ++renderRequestIdRef.current;

    try {
      const img = await loadImage(source);
      const canvas = outputCanvasRef.current;
      if (!canvas) return;

      const charSpacing = 1;
      const charAspect = 0.55;

      // Compute or reuse canvas size based on container
      if (!maxCanvasSizeRef.current) {
        const wrapper = canvas.parentElement;
        const rect = wrapper?.getBoundingClientRect();
        const wrapperWidth = rect ? Math.max(240, Math.min(860, Math.floor(rect.width))) : Math.min(860, Math.max(240, img.width));
        const wrapperHeight = rect ? Math.max(120, Math.floor(rect.height)) : Math.max(120, Math.round((wrapperWidth * img.height) / img.width));
        const aspectRatio = img.width / img.height;
        let displayWidth = wrapperWidth;
        let displayHeight = Math.round(displayWidth / aspectRatio);
        if (displayHeight > wrapperHeight) {
          displayHeight = wrapperHeight;
          displayWidth = Math.round(displayHeight * aspectRatio);
        }
        maxCanvasSizeRef.current = { width: displayWidth, height: displayHeight };
      }

      const maxCanvasWidth = maxCanvasSizeRef.current.width;
      const maxCanvasHeight = maxCanvasSizeRef.current.height;

      // Density directly controls number of symbols in width
      const targetCols = Math.max(1, density);
      // Calculate font size to fit all columns in the same canvas width
      // No Math.max minimum - allows fontSize to go below 4 for higher density values
      const fontSize = Math.floor(maxCanvasWidth / targetCols / charSpacing);
      const safeFontSize = Math.max(1, fontSize); // Keep minimum at 1 for canvas rendering
      // Calculate target rows based on image aspect ratio and char aspect
      const targetRows = Math.max(1, Math.round((targetCols * img.height) / img.width * charAspect));

      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(maxCanvasWidth * dpr));
      canvas.height = Math.max(1, Math.floor(maxCanvasHeight * dpr));
      canvas.style.width = `${maxCanvasWidth}px`;
      canvas.style.height = `${maxCanvasHeight}px`;
      canvas.style.background = "transparent";

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, maxCanvasWidth, maxCanvasHeight);

      const getFilteredSource = (sourceImage: HTMLImageElement): HTMLCanvasElement | HTMLImageElement => {
        if (blur <= 0 && sharpen <= 0) {
          return sourceImage;
        }

        const buffer = document.createElement("canvas");
        buffer.width = sourceImage.naturalWidth || sourceImage.width;
        buffer.height = sourceImage.naturalHeight || sourceImage.height;
        const bufferCtx = buffer.getContext("2d");
        if (!bufferCtx) {
          return sourceImage;
        }

        const blurPx = Math.max(0, Math.min(30, blur / 10));
        bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
        bufferCtx.filter = `blur(${blurPx}px)`;
        bufferCtx.drawImage(sourceImage, 0, 0, buffer.width, buffer.height);

        if (sharpen > 0) {
          const strength = Math.min(2, sharpen / 50);
          const imageData = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);
          const srcData = imageData.data;
          const result = new Uint8ClampedArray(srcData);
          const width = buffer.width;
          const height = buffer.height;
          const kernelCenter = 1 + 4 * strength;

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;
              for (let channel = 0; channel < 3; channel++) {
                const center = srcData[idx + channel] * kernelCenter;
                const left = srcData[idx + channel - 4];
                const right = srcData[idx + channel + 4];
                const top = srcData[idx + channel - width * 4];
                const bottom = srcData[idx + channel + width * 4];
                const value = center - left - right - top - bottom;
                result[idx + channel] = Math.min(255, Math.max(0, Math.round(value)));
              }
            }
          }

          imageData.data.set(result);
          bufferCtx.putImageData(imageData, 0, 0);
        }

        return buffer;
      };

      const selectedCharset = (() => {
        switch (mode) {
          case "GRAYSCALE":
            return DEFAULT_OPTIONS.charset;
          case "BRAILLE":
            return CHARSETS.braille;
          case "BLOCKS":
            return CHARSETS.blocks;
          case "EXTENDED":
            return CHARSETS.ascii;
          default: {
            const custom = customModes.find((item) => item.label === mode);
            return custom?.charset ?? DEFAULT_OPTIONS.charset;
          }
        }
      })();

      const useGrayscale = mode === "GRAYSCALE" || activeColor.label === "BLACK & WHITE";
      const colorMode: ColorMode = useGrayscale ? "grayscale" : "fullcolor";
      const opts = {
        ...DEFAULT_OPTIONS,
        fontSize: safeFontSize,
        charSpacing,
        charAspect,
        charset: selectedCharset,
        colorMode,
        brightness: Math.max(-1, Math.min(1, (brightness - 100) / 100)),
        contrast: Math.max(-1, Math.min(1, (contrast - 100) / 100)),
        invert: inverted,
        hoverStrength: 0,
        renderMode: "ascii" as const,
      };

      const sourceForAscii = getFilteredSource(img);
      // Pass pixel dimensions to imageToAsciiFrame; fontSize in opts controls symbol size
      const { frame } = imageToAsciiFrame(sourceForAscii, opts, maxCanvasWidth, maxCanvasHeight);
      const textResult = frame.map((row) => row.map((cell) => {
        if (!cell) return " ";
        const char = cell.char ?? " ";
        return char === undefined || char === null ? " " : String(char);
      }).join("")).join("\n");
      setAsciiText(textResult);

      // Custom transparent renderer: draw only ASCII glyphs and leave background transparent.
      const renderFrameToCanvasTransparent = (
        ctx: CanvasRenderingContext2D,
        frame: any[],
        width: number,
        height: number
      ) => {
        if (!frame || frame.length === 0) return;
        const rows = frame.length;
        const cols = frame[0].length || 0;
        if (cols === 0) return;

        const cellW = width / cols;
        const cellH = height / rows;

        const getBrightness = (r: number, g: number, b: number) => {
          return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        };

        const getTintColor = (brightness: number) => {
          const target = activeColor.label;
          if (target === "COLOR") {
            return null;
          }
          if (target === "BLACK & WHITE") {
            const gray = Math.round(brightness * 255);
            return { r: gray, g: gray, b: gray };
          }
          const colorHex = activeColor.hex;
          if (!colorHex) {
            return { r: 255, g: 255, b: 255 };
          }
          // Tint using selected base color but preserve brightness.
          const hex = colorHex.replace("#", "");
          const baseR = parseInt(hex.slice(0, 2), 16);
          const baseG = parseInt(hex.slice(2, 4), 16);
          const baseB = parseInt(hex.slice(4, 6), 16);
          return {
            r: Math.round(baseR * brightness),
            g: Math.round(baseG * brightness),
            b: Math.round(baseB * brightness),
          };
        };

        const getMonoColor = () => {
          const hex = activeColor.hex;
          if (!hex) {
            return { r: 255, g: 255, b: 255 };
          }
          const cleanHex = hex.replace("#", "");
          return {
            r: parseInt(cleanHex.slice(0, 2), 16),
            g: parseInt(cleanHex.slice(2, 4), 16),
            b: parseInt(cleanHex.slice(4, 6), 16),
          };
        };

        const monoFill = getMonoColor();

        ctx.textBaseline = "top";
        ctx.font = `${Math.floor(cellH)}px "JetBrains Mono", monospace`;

        for (let r = 0; r < rows; r++) {
          const row = frame[r];
          for (let c = 0; c < cols; c++) {
            const cell = row[c];
            if (!cell) continue;
            const ch = cell.char || " ";
            const a = cell.a ?? 255;
            const alpha = a <= 1 ? a : a / 255;
            if (ch === " " || alpha <= 0.03) continue;

            let fillColor = { r: 255, g: 255, b: 255 };
            if (monoColor) {
              fillColor = { r: monoFill.r, g: monoFill.g, b: monoFill.b };
            } else {
              const rcol = Math.round(cell.r ?? 255);
              const gcol = Math.round(cell.g ?? 255);
              const bcol = Math.round(cell.b ?? 255);

              if (activeColor.label === "COLOR") {
                fillColor = { r: rcol, g: gcol, b: bcol };
              } else {
                const tint = getTintColor(getBrightness(rcol, gcol, bcol));
                fillColor = tint ?? { r: rcol, g: gcol, b: bcol };
              }
            }

            if (invertAmount > 0) {
              const factor = Math.max(0, Math.min(1, invertAmount / 100));
              fillColor = {
                r: Math.round(fillColor.r * (1 - factor) + (255 - fillColor.r) * factor),
                g: Math.round(fillColor.g * (1 - factor) + (255 - fillColor.g) * factor),
                b: Math.round(fillColor.b * (1 - factor) + (255 - fillColor.b) * factor),
              };
            }

            ctx.fillStyle = `rgba(${fillColor.r},${fillColor.g},${fillColor.b},${alpha})`;
            const tc = mirrorX ? (cols - 1 - c) : c;
            const tr = mirrorY ? (rows - 1 - r) : r;
            const xPos = tc * cellW;
            const yPos = tr * cellH;
            ctx.fillText(ch, xPos, yPos);
          }
        }
      };

      renderFrameToCanvasTransparent(ctx, frame, maxCanvasWidth, maxCanvasHeight);

      setAsciiDataUrl(canvas.toDataURL("image/png"));
      setAsciiReady(true);
      if (file) {
        setUploadedFile(file);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }, [brightness, contrast, blur, sharpen, invertAmount, density, inverted, activeColor, monoColor, mirrorX, mirrorY, mode]);

  const handleFileSelect = useCallback((file: File) => {
    stopAsciiVideo();
    const source = URL.createObjectURL(file);
    if (currentBlobUrlRef.current && currentBlobUrlRef.current !== source && currentBlobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }
    currentBlobUrlRef.current = source;
    setUploadedFile(file);
    setCurrentSourceName(file.name);
    setCurrentSourceFile(file);
    setCurrentSource(source);
    setUrlInput("");
    setAsciiReady(false);
    setAsciiDataUrl("");
    setAsciiText("");
    maxCanvasSizeRef.current = null;
  }, []);

  const handleUpload = async () => {
    if (!uploadedFile && !urlInput) return;

    let source: string | undefined;
    if (uploadedFile) {
      source = URL.createObjectURL(uploadedFile);
      setCurrentSourceName(uploadedFile.name);
      setCurrentSourceFile(uploadedFile);
      setUploadedFile(uploadedFile);
    } else {
      source = urlInput.trim();
      setCurrentSourceName(urlInput.trim());
      setCurrentSourceFile(null);
    }

    if (!source) return;
    if (source.startsWith("blob:")) {
      if (currentBlobUrlRef.current && currentBlobUrlRef.current !== source && currentBlobUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      currentBlobUrlRef.current = source;
    }

    maxCanvasSizeRef.current = null;
    setCurrentSource(source);
    await renderMediaSource(source, uploadedFile ?? undefined);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileExtensionFromUrl = (source: string) => {
    try {
      const pathname = new URL(source).pathname;
      const match = pathname.match(/\.(gif|mp4|mov|webm|ogg)(?:[?#]|$)/i);
      return match ? match[0].toLowerCase() : "";
    } catch {
      return "";
    }
  };

  const downloadFileSource = async (file: File | null | undefined, source?: string, defaultName = "download") => {
    if (file) {
      downloadBlob(file, file.name || `${defaultName}${file.type === "image/gif" ? ".gif" : file.type.startsWith("video/") ? ".mp4" : ""}`);
      return;
    }
    if (!source) return;
    try {
      const resp = await fetch(source);
      const blob = await resp.blob();
      const ext = getFileExtensionFromUrl(source);
      const filename = `${defaultName}${ext || ""}`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error("Ошибка скачивания файла:", error);
    }
  };

  const downloadCurrentSourceFile = async (allowedTypes: RegExp, defaultName: string) => {
    if (!currentSource && !currentSourceFile) return;
    if (currentSourceFile && allowedTypes.test(currentSourceFile.type)) {
      downloadBlob(currentSourceFile, currentSourceFile.name || `${defaultName}${currentSourceFile.type === "image/gif" ? ".gif" : ".mp4"}`);
      return;
    }

    if (currentSource && allowedTypes.test(currentSource)) {
      await downloadFileSource(currentSourceFile, currentSource, defaultName);
    }
  };

  const handleDownloadGif = async () => {
    if (!gifBlobRef.current) {
      alert("GIF ещё не готов к скачиванию. Дождитесь завершения обработки.");
      return;
    }

    const url = URL.createObjectURL(gifBlobRef.current);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ascii_animation_${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadVideo = async () => {
    if (!videoBlobRef.current) {
      alert("Видео ещё не готово к скачиванию. Дождитесь завершения обработки.");
      return;
    }

    const url = URL.createObjectURL(videoBlobRef.current);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ascii_video_${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderMediaSource = useCallback(async (source: string, file?: File) => {
    if (isVideoSourceFile(source, file)) {
      await renderVideoSource(source, file);
    } else {
      await renderImageSource(source, file);
    }
  }, [isVideoSourceFile, renderImageSource, renderVideoSource]);

  const scheduleMediaRender = useCallback((source: string, file?: File, delay = 120) => {
    stopPendingRender();
    renderTimerRef.current = window.setTimeout(() => {
      renderTimerRef.current = null;
      renderMediaSource(source, file);
    }, delay);
  }, [renderMediaSource, stopPendingRender]);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items?.length) return;

    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        const source = URL.createObjectURL(file);
        if (currentBlobUrlRef.current && currentBlobUrlRef.current !== source && currentBlobUrlRef.current.startsWith("blob:")) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        }
        currentBlobUrlRef.current = source;

        setUploadedFile(file);
        setCurrentSourceName(file.name || "pasted-image.png");
        setCurrentSourceFile(file);
        setCurrentSource(source);
        maxCanvasSizeRef.current = null;
        return;
      }
    }
  }, [renderMediaSource]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (!currentSource) return;
    scheduleMediaRender(currentSource, currentSourceFile ?? undefined);
    return () => stopPendingRender();
  }, [currentSource, currentSourceFile, density, inverted, activeColor, monoColor, mirrorX, mirrorY, brightness, contrast, blur, sharpen, invertAmount, mode, renderMediaSource, scheduleMediaRender, stopPendingRender]);

  const toDataUrlFromFile = (file: File) => new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = (e) => reject(e);
    fr.readAsDataURL(file);
  });

  const toDataUrlFromUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = (e) => reject(e);
        fr.readAsDataURL(blob);
      });
    } catch (err) {
      return "";
    }
  };

  const getCurrentCanvasDataUrl = useCallback(() => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  }, []);

  const getCurrentAsciiOptions = useCallback(() => {
    const selectedCharset = (() => {
      switch (mode) {
        case "GRAYSCALE":
          return DEFAULT_OPTIONS.charset;
        case "BRAILLE":
          return CHARSETS.braille;
        case "BLOCKS":
          return CHARSETS.blocks;
        case "EXTENDED":
          return CHARSETS.ascii;
        default: {
          const custom = customModes.find((item) => item.label === mode);
          return custom?.charset ?? DEFAULT_OPTIONS.charset;
        }
      }
    })();

    const useGrayscale = mode === "GRAYSCALE" || activeColor.label === "BLACK & WHITE";
    const colorMode: ColorMode = useGrayscale ? "grayscale" : "fullcolor";

    return {
      ...DEFAULT_OPTIONS,
      fontSize: Math.max(1, Math.floor((outputCanvasRef.current?.width ?? 640) / (window.devicePixelRatio || 1) / Math.max(1, density) / 1)),
      charSpacing: 1,
      charAspect: 0.55,
      charset: selectedCharset,
      colorMode,
      brightness: Math.max(-1, Math.min(1, (brightness - 100) / 100)),
      contrast: Math.max(-1, Math.min(1, (contrast - 100) / 100)),
      invert: inverted,
      hoverStrength: 0,
      renderMode: "ascii" as const,
    };
  }, [activeColor.label, brightness, contrast, customModes, density, inverted, mode]);

  const computeAsciiTextFromCanvas = useCallback(async () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return "";

    const dpr = window.devicePixelRatio || 1;
    const sourceWidth = Math.max(1, Math.round(canvas.width / dpr));
    const sourceHeight = Math.max(1, Math.round(canvas.height / dpr));

    const imageSrc = canvas.toDataURL();
    const img = new Image();
    img.src = imageSrc;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Не удалось загрузить канал для текста ASCII"));
    });

    const opts = getCurrentAsciiOptions();
    const { frame } = imageToAsciiFrame(img, opts, sourceWidth, sourceHeight);
    const text = frame.map((row) => row.map((cell) => {
      if (!cell) return " ";
      const char = cell.char ?? " ";
      return char === undefined || char === null ? " " : String(char);
    }).join("")).join("\n");

    setAsciiText(text);
    return text;
  }, [asciiText, getCurrentAsciiOptions]);

  const handleSaveToGallery = async () => {
    if (!asciiReady) return;
    const currentPng = getCurrentCanvasDataUrl();
    if (!currentPng) return;
    const asciiDataUrlToSave = currentPng;
    const fileName = saveName.trim() || `ascii_${Date.now()}.png`;
    const estimatedSize = Math.max(10240, Math.ceil((asciiDataUrlToSave.length - "data:image/png;base64,".length) * 3 / 4));
    const canvas = outputCanvasRef.current;
    const displayWidth = canvas ? Math.round(canvas.width / (window.devicePixelRatio || 1)) : 180;
    const displayHeight = canvas ? Math.round(canvas.height / (window.devicePixelRatio || 1)) : 150;

    if (!asciiDataUrl) {
      setAsciiDataUrl(asciiDataUrlToSave);
    }

    let originalSrc: string | undefined = undefined;
    try {
      if (currentSource && asciiDataUrlToSave && currentSource === asciiDataUrlToSave) {
        originalSrc = undefined;
      } else if (currentSourceFile) {
        originalSrc = await toDataUrlFromFile(currentSourceFile);
      } else if (currentSource && currentSource.startsWith("data:")) {
        originalSrc = currentSource;
      } else if (currentSource) {
        const d = await toDataUrlFromUrl(currentSource);
        if (d) originalSrc = d;
      }
    } catch (err) {
      originalSrc = undefined;
    }

    onSaveGalleryItem({
      id: Date.now(),
      name: fileName,
      ext: "png",
      w: displayWidth,
      h: displayHeight,
      size: estimatedSize,
      createdAt: Date.now(),
      src: asciiDataUrlToSave,
      originalSrc,
    });
    setSaveModalOpen(false);
    setSaveName("");
  };

  const handleDownloadPng = () => {
    if (!asciiReady) return;
    const link = document.createElement("a");
    const dataUrl = getCurrentCanvasDataUrl();
    if (!dataUrl) return;
    link.href = dataUrl;
    link.download = `ascii_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadText = async () => {
    if (!asciiReady) return;
    const text = await computeAsciiTextFromCanvas();
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ascii_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    if (!asciiReady) return;
    const text = await computeAsciiTextFromCanvas();
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };


  const clearCanvas = () => {
    // Preserve restoreState whenever there is a currentSource so the
    // "вернуть" button appears after clearing, regardless of whether
    // the source originated from an upload, gallery, or URL.
    if (currentSource) {
      setRestoreState({
        source: currentSource,
        file: currentSourceFile ?? uploadedFile ?? null,
        name: currentSourceName,
        urlInput,
      });
    } else {
      setRestoreState(null);
    }

    setUploadedFile(null);
    setCurrentSource(undefined);
    setCurrentSourceFile(null);
    setCurrentSourceName("");
    setAsciiReady(false);
    setAsciiDataUrl("");
    setAsciiText("");
    setProcessing(false);
    setUrlInput("");
    maxCanvasSizeRef.current = null;
    if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }
    currentBlobUrlRef.current = null;
    stopAsciiVideo();
  };

  const restoreCanvas = () => {
    if (!restoreState) return;
    const source = restoreState.file ? URL.createObjectURL(restoreState.file) : restoreState.source;
    if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }
    currentBlobUrlRef.current = source;
    setUploadedFile(restoreState.file);
    setCurrentSource(source);
    setCurrentSourceFile(restoreState.file);
    setCurrentSourceName(restoreState.name);
    setUrlInput(restoreState.urlInput);
    setRestoreState(null);
  };

  const bumpDensity = (dir: 1 | -1) => {
    setDensity((v) => Math.min(140, Math.max(20, v + dir * 20)));
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
            {!uploadedFile ? (
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#333", marginBottom: "10px", textAlign: "center" }}>
                или выберите файл, или нажмите <strong>Ctrl+V</strong> после копирования изображения
              </p>
            ) : (
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#333", marginBottom: "10px", textAlign: "center" }}>
                Вставленное изображение готово к конвертации
              </p>
            )}
            <SmallButton label="ВЫБРАТЬ ФАЙЛ" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} />
            <input ref={fileInputRef} type="file" accept="image/*,video/*,.gif" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              handleFileSelect(f);
            }} />
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

            <Dropdown
              value={mode}
              buttonLabel={mode === "GRAYSCALE" ? "MODE" : mode}
              options={[
                ...customModes.map((item) => item.label),
                "GRAYSCALE",
                "BRAILLE",
                "BLOCKS",
                "EXTENDED",
                "ADD NEW...",
              ]}
              onChange={(v) => {
                if (v === "ADD NEW...") {
                  setEditingModeLabel(null);
                  setNewModeName("");
                  setNewCharset(DEFAULT_OPTIONS.charset);
                  setAddModeOpen(true);
                  return;
                }
                setMode(v);
              }}
              onOptionContextMenu={(opt, e) => {
                const custom = customModes.find((item) => item.label === opt);
                if (!custom) return;
                e.preventDefault();
                setEditingModeLabel(opt);
                setNewModeName(opt);
                setNewCharset(custom.charset);
                setAddModeOpen(true);
              }}
            />

            {/* (moved controls: INV, MONO, MIRROR, color swatches) - placed near Photo editing below */}

            <div className="flex-1" />
            <button
              className="text-[#333] hover:text-[#555] transition-colors active:text-[#00ff41]"
              title="Сбросить настройки"
              onClick={resetPhotoSettings}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={13} />
              СБРОС
            </button>
          </div>

          {/* Photo editing row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
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

              {/* MONO toggle button — force all glyphs white */}
              <button
                onMouseDown={() => {}}
                onMouseUp={() => {}}
                onMouseLeave={() => {}}
                onClick={() => {
                  setMonoColor((v) => !v);
                }}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  padding: "6px 14px",
                  border: `1px solid ${monoColor ? "#00ff41" : "#2a2a2a"}`,
                  background: monoColor ? "#00ff4120" : "#111",
                  color: monoColor ? "#00ff41" : "#888",
                  transform: "scale(1)",
                  transition: "all 0.1s",
                  cursor: "pointer",
                  marginLeft: "6px",
                }}
              >
                MONO{monoColor ? " ✓" : ""}
              </button>

              {/* MIRROR toggles */}
              <button
                onClick={() => {
                  setMirrorX((v) => !v);
                }}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  padding: "6px 10px",
                  border: `1px solid ${mirrorX ? "#00ff41" : "#2a2a2a"}`,
                  background: mirrorX ? "#00ff4120" : "#111",
                  color: mirrorX ? "#00ff41" : "#888",
                  marginLeft: "6px",
                  cursor: "pointer",
                }}
              >
                MIRROR X{mirrorX ? " ✓" : ""}
              </button>

              <button
                onClick={() => {
                  setMirrorY((v) => !v);
                }}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  padding: "6px 10px",
                  border: `1px solid ${mirrorY ? "#00ff41" : "#2a2a2a"}`,
                  background: mirrorY ? "#00ff4120" : "#111",
                  color: mirrorY ? "#00ff41" : "#888",
                  marginLeft: "6px",
                  cursor: "pointer",
                }}
              >
                MIRROR Y{mirrorY ? " ✓" : ""}
              </button>

              {/* Color dropdown with preview */}
              <Dropdown
                value={colorLabel}
                options={COLOR_OPTIONS.map((c) => c.label)}
                onChange={setColorLabel}
                renderOption={(opt) => {
                  const c = COLOR_OPTIONS.find((x) => x.label === opt);
                  const optionColor = opt === "CUSTOM"
                    ? customColor
                    : opt === "BLACK & WHITE"
                      ? "#fff"
                      : c?.hex;
                  return (
                    <span className="flex items-center gap-2">
                      <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: optionColor || "linear-gradient(135deg,#ff1744,#00ff41,#40c4ff)", display: "inline-block", border: "1px solid #333", flexShrink: 0 }} />
                      {opt}
                    </span>
                  );
                }}
              />
              {colorLabel === "CUSTOM" && (
                <input
                  type="color"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                  className="ml-2 h-8 w-8 p-0 border border-[#333] bg-transparent cursor-pointer"
                  style={{ appearance: "none", borderRadius: "4px" }}
                />
              )}

              {activeColor.hex && (
                <span
                  className="flex items-center gap-1.5 px-2 py-1 border border-[#1e1e1e]"
                  style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: activeColor.hex }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: activeColor.hex, display: "inline-block" }} />
                  {activeColor.label}
                </span>
              )}
            </div>
            <Dropdown value={editingMode} options={["PHOTO EDITING", "BRIGHTNESS", "CONTRAST", "SHARPEN", "BLUR", "INVERT"]} onChange={setEditingMode} />
          </div>

          {editingMode === "BRIGHTNESS" && (
            <div className="flex items-center gap-3 mb-3" style={{ padding: "0 20px" }}>
              <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "80px" }}>
                ЯРКОСТЬ
              </label>
              <input
                type="range"
                min={20}
                max={200}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#00ff41" }}
              />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "44px", textAlign: "right" }}>
                {brightness}%
              </span>
            </div>
          )}

          {editingMode === "CONTRAST" && (
            <div className="flex items-center gap-3 mb-3" style={{ padding: "0 20px" }}>
              <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "80px" }}>
                КОНТРАСТ
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#00ff41" }}
              />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "44px", textAlign: "right" }}>
                {contrast - 100}%
              </span>
            </div>
          )}

          {editingMode === "BLUR" && (
            <div className="flex items-center gap-3 mb-3" style={{ padding: "0 20px" }}>
              <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "80px" }}>
                РАЗМЫТИЕ
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#00ff41" }}
              />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "44px", textAlign: "right" }}>
                {blur}%
              </span>
            </div>
          )}

          {editingMode === "SHARPEN" && (
            <div className="flex items-center gap-3 mb-3" style={{ padding: "0 20px" }}>
              <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "80px" }}>
                РЕЗКОСТЬ
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={sharpen}
                onChange={(e) => setSharpen(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#00ff41" }}
              />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "44px", textAlign: "right" }}>
                {sharpen}%
              </span>
            </div>
          )}

          {editingMode === "INVERT" && (
            <div className="flex items-center gap-3 mb-3" style={{ padding: "0 20px" }}>
              <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "80px" }}>
                ИНВЕРСИЯ
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={invertAmount}
                onChange={(e) => setInvertAmount(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#00ff41" }}
              />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#c8ffc8", minWidth: "44px", textAlign: "right" }}>
                {invertAmount}%
              </span>
            </div>
          )}

          {/* Preview area */}
          <div className="flex-1 relative border border-[#1e1e1e] overflow-hidden" style={{ background: "transparent", minHeight: "200px" }}>
            {(currentSource || asciiReady || processing) && (
              <button
                onClick={clearCanvas}
                className="absolute top-3 left-3 z-10 w-10 h-10 flex items-center justify-center border border-[#333] rounded-full bg-[#111] text-[#ff1744] hover:bg-[#161616] transition-colors"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "24px", lineHeight: 1 }}
                aria-label="Удалить файл"
              >
                X
              </button>
            )}
            {!currentSource && restoreState && (
              <button
                onClick={restoreCanvas}
                className="absolute top-3 left-3 z-10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] border border-[#333] rounded-lg bg-[#111] text-[#c8ffc8] hover:bg-[#161616] transition-colors"
                style={{ fontFamily: "'Share Tech Mono', monospace " }}
              >
                вернуть 
              </button>
            )}
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
              { label: "КОПИЯ",   icon: <Copy size={11} />,        action: handleCopyText },
              { label: "ТЕКСТ",   icon: <Type size={11} />, action: handleDownloadText },
              { label: "PNG",     icon: <ImageIcon size={11} />, action: handleDownloadPng },
              { label: "GIF",     icon: <Film size={11} />, action: handleDownloadGif },
              { label: "ВИДЕО",   icon: <Film size={11} />, action: handleDownloadVideo },
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
          {isAddModeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-md rounded-xl border border-[#222] bg-[#0c0c0c] p-5">
                <h2 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color: "#c8c8c8", marginBottom: "10px" }}>
                  ДОБАВИТЬ НОВЫЙ РЕЖИМ
                </h2>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#888", lineHeight: "1.6", marginBottom: "14px" }}>
                  Вставьте градиент символов и задайте имя нового режима.
                </p>
                <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#888" }}>
                  Градиент символов
                </label>
                <textarea
                  value={newCharset}
                  onChange={(e) => setNewCharset(e.target.value)}
                  placeholder={DEFAULT_OPTIONS.charset}
                  className="w-full bg-[#111] border border-[#222] px-3 py-2 text-[#c8c8c8] focus:outline-none"
                  style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", minHeight: "96px", resize: "vertical" as const }}
                />
                <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#888", marginTop: "12px", display: "block" }}>
                  Название режима
                </label>
                <input
                  value={newModeName}
                  onChange={(e) => setNewModeName(e.target.value)}
                  placeholder="Например: MY GRADIENT"
                  className="w-full bg-[#111] border border-[#222] px-3 py-2 text-[#c8c8c8] focus:outline-none"
                  style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setAddModeOpen(false)}
                    className="px-3 py-2 border border-[#222] text-[#888] hover:border-[#444] hover:text-[#c8c8c8] transition-colors"
                    style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
                  >
                    ОТМЕНА
                  </button>
                  <button
                    onClick={() => {
                      const label = newModeName.trim();
                      const charset = newCharset.trim();
                      if (!label || !charset) return;
                      setCustomModes((prev) => {
                        const next = prev.filter((item) => item.label !== editingModeLabel && item.label !== label);
                        return [...next, { label, charset }];
                      });
                      setMode(label);
                      setAddModeOpen(false);
                      setEditingModeLabel(null);
                      setNewModeName("");
                      setNewCharset(DEFAULT_OPTIONS.charset);
                    }}
                    className="px-3 py-2 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff4122] transition-all"
                    style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
                  >
                    {editingModeLabel ? "СОХРАНИТЬ ИЗМЕНЕНИЯ" : "СОХРАНИТЬ РЕЖИМ"}
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

function GalleryPage({ onNavigate, items, onDeleteItem, onSelectItem, skipDeleteConfirm, setSkipDeleteConfirm }: { onNavigate: (p: Page, initialAsciiSrc?: string, initialName?: string) => void; items: GalleryItem[]; onDeleteItem?: (id: number) => void; onSelectItem?: (item: GalleryItem) => void; skipDeleteConfirm: boolean; setSkipDeleteConfirm: (value: boolean) => void }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE (NEWEST)");
  const [search, setSearch] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<GalleryItem | null>(null);
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
  const canDeleteWithoutConfirm = skipDeleteConfirm;

  const handleRequestDelete = (item: GalleryItem) => {
    if (canDeleteWithoutConfirm) {
      onDeleteItem?.(item.id);
      return;
    }
    setDeleteCandidate(item);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    onDeleteItem?.(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  const cancelDelete = () => setDeleteCandidate(null);

  const filtered = items.filter((item) => {
    const ms = item.name.toLowerCase().includes(search.toLowerCase());
    const mt = filterType === "ALL" || (filterType === "IMAGE" && item.ext === "png") || (filterType === "GIF" && item.ext === "gif") || (filterType === "VIDEO" && item.ext === "mp4");
    return ms && mt;
  });

  const sorted = filtered.slice().sort((a, b) => {
    switch (sortBy) {
      case "DATE (NEWEST)": {
        const ta = parseSavedCreatedAt(a) ?? 0;
        const tb = parseSavedCreatedAt(b) ?? 0;
        return tb - ta;
      }
      case "DATE (OLDEST)": {
        const ta = parseSavedCreatedAt(a) ?? 0;
        const tb = parseSavedCreatedAt(b) ?? 0;
        return ta - tb;
      }
      case "NAME (A-Z)":
        return a.name.localeCompare(b.name);
      case "NAME (Z-A)":
        return b.name.localeCompare(a.name);
      case "SIZE":
        return (b.size ?? 0) - (a.size ?? 0);
      default:
        return 0;
    }
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

        {/* Load more removed — pagination not implemented */}
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
              {sorted.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  onDelete={() => handleRequestDelete(item)}
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
                {sorted.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#0e0e0e] transition-colors"
                    style={{ borderBottom: "1px solid #111", cursor: onSelectItem ? "pointer" : "auto" }}
                    onClick={() => onSelectItem?.(item)}
                  >
                    <td className="py-2 pr-8" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#888" }}>{item.name}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>{item.w}x{item.h}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>{item.ext}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#444" }}>{formatTimeAgo(parseSavedCreatedAt(item), item.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {deleteCandidate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#222] bg-[#0c0c0c] p-5">
            <h2 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color: "#c8c8c8", marginBottom: "10px" }}>
              ПОДТВЕРДИТЕ УДАЛЕНИЕ
            </h2>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#888", lineHeight: "1.6", marginBottom: "18px" }}>
              Вы уверены, что хотите удалить <strong>{deleteCandidate.name}</strong> из галереи? Это действие нельзя отменить.
            </p>
            <label className="flex items-center gap-2 mb-4" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#ccc" }}>
              <input
                type="checkbox"
                checked={skipDeleteConfirm}
                onChange={(e) => setSkipDeleteConfirm(e.target.checked)}
                className="h-4 w-4 bg-[#111] border border-[#333] text-[#00ff41] focus:ring-0"
                style={{ accentColor: "#00ff41" }}
              />
              <span>Больше не спрашивать</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-2 border border-[#222] text-[#888] hover:border-[#444] hover:text-[#c8c8c8] transition-colors"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
              >
                ОТМЕНА
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 border border-[#ff1744] text-[#ff1744] hover:bg-[#ff174411] transition-all"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px" }}
              >
                УДАЛИТЬ
              </button>
            </div>
          </div>
        </div>
      )}
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
          ║  import img{item.id} from "@/imports/…"  ║
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
          {formatTimeAgo(parseSavedCreatedAt(item), item.time)}
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
  const [page, setPage] = useState<Page>(() => {
    if (typeof window === "undefined") return "home";
    try {
      const savedPage = window.localStorage.getItem("virgo_page_state");
      if (savedPage === "home" || savedPage === "conversion" || savedPage === "gallery") {
        return savedPage;
      }
    } catch {
      // ignore
    }
    return "home";
  });
  const [selectedGallerySrc, setSelectedGallerySrc] = useState<string | undefined>(undefined);
  const [selectedGalleryName, setSelectedGalleryName] = useState<string | undefined>(undefined);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("virgo_page_state", page);
    } catch {
      // ignore persistence failure
    }
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("virgo_skip_delete_confirm");
      if (raw !== null) {
        setSkipDeleteConfirm(raw === "true");
      }
    } catch {
      // ignore load failure
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("virgo_skip_delete_confirm", String(skipDeleteConfirm));
    } catch {
      // ignore persistence failure
    }
  }, [skipDeleteConfirm]);

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
          skipDeleteConfirm={skipDeleteConfirm}
          setSkipDeleteConfirm={setSkipDeleteConfirm}
          onDeleteItem={(id) => setGalleryItems((prev) => prev.filter((i) => i.id !== id))}
          onSelectItem={(item) => handleNavigate("conversion", item.originalSrc ?? item.src, item.name)}
        />
      )}
    </div>
  );
}
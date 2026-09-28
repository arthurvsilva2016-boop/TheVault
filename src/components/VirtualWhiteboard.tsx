import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pencil, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Type, 
  StickyNote, 
  Image as ImageIcon, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download, 
  Share2, 
  Grid, 
  Maximize2, 
  Minimize2, 
  X, 
  Check, 
  Palette, 
  Sparkles, 
  MousePointer,
  Cloud,
  CheckCircle2,
  Loader2,
  FileText,
  LayoutTemplate,
  Paintbrush,
  Send,
  HelpCircle,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PlusCircle,
  Smile,
  Magnet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { WhiteboardStroke, WhiteboardText, WhiteboardSticky, WhiteboardImage, WhiteboardState } from '../types';

export type TemplateType = 'blank' | 'grid' | 'lined' | 'dots' | 'mindmap' | 'cornell' | 'venn' | 'kanban' | 'cartesian';

interface PredefinedTemplate {
  id: TemplateType;
  name: string;
  category: 'Paper Background' | 'Classroom Framework';
  description: string;
  icon: string;
  gridPattern: 'dots' | 'grid' | 'lined' | 'none';
  initialState?: () => Partial<WhiteboardState>;
}

export interface WhiteboardSnapshotData {
  imageDataUrl: string;
  pdfDataUrl?: string;
  state: WhiteboardState;
  title: string;
  timestamp: string;
}

interface VirtualWhiteboardProps {
  boardId?: string;
  title?: string;
  authorName?: string;
  onShareToChat?: (imageUrl: string, noteText?: string) => void;
  onClose?: () => void;
  initialState?: Partial<WhiteboardState>;
  heightClass?: string;
  showTeacherControls?: boolean;
  onBrush?: (snapshot: WhiteboardSnapshotData) => void;
  onSendCurrentBoard?: (snapshot: WhiteboardSnapshotData) => void;
}

const COLOR_PALETTE = [
  '#ffffff', // White
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#94a3b8', // Slate Gray
  '#000000', // Black
];

const STICKY_COLORS = [
  { bg: 'bg-amber-300 text-amber-950 border-amber-400', hex: '#fef08a', label: 'Yellow' },
  { bg: 'bg-emerald-300 text-emerald-950 border-emerald-400', hex: '#a7f3d0', label: 'Green' },
  { bg: 'bg-sky-300 text-sky-950 border-sky-400', hex: '#bae6fd', label: 'Blue' },
  { bg: 'bg-purple-300 text-purple-950 border-purple-400', hex: '#e9d5ff', label: 'Purple' },
  { bg: 'bg-rose-300 text-rose-950 border-rose-400', hex: '#fecdd3', label: 'Pink' },
];

const TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Darkboard',
    category: 'Paper Background',
    description: 'Clean dark slate for freeform sketching, drawing, and mathematics.',
    icon: '⬛',
    gridPattern: 'none'
  },
  {
    id: 'grid',
    name: 'Graph / Grid Paper',
    category: 'Paper Background',
    description: 'Crisp isometric coordinate grid for geometry, charts, and alignment.',
    icon: '📐',
    gridPattern: 'grid'
  },
  {
    id: 'lined',
    name: 'Lined Notebook Paper',
    category: 'Paper Background',
    description: 'Ruled notebook lines with margin boundary for handwriting and grammar notes.',
    icon: '📝',
    gridPattern: 'lined'
  },
  {
    id: 'dots',
    name: 'Dot Matrix Grid',
    category: 'Paper Background',
    description: 'Subtle bullet-journal dot pattern providing unobtrusive spatial guidance.',
    icon: '⠇',
    gridPattern: 'dots'
  },
  {
    id: 'mindmap',
    name: 'Mind Map Brainstorm',
    category: 'Classroom Framework',
    description: 'Central concept hub branching out into 4 interactive idea nodes.',
    icon: '🧠',
    gridPattern: 'dots',
    initialState: () => ({
      strokes: [
        // Center circle
        { id: 's-c1', tool: 'circle', color: '#a855f7', size: 3, points: [{ x: 380, y: 180 }, { x: 540, y: 300 }] },
        // Connecting arrows
        { id: 's-a1', tool: 'arrow', color: '#3b82f6', size: 3, points: [{ x: 380, y: 220 }, { x: 220, y: 140 }] },
        { id: 's-a2', tool: 'arrow', color: '#10b981', size: 3, points: [{ x: 540, y: 220 }, { x: 700, y: 140 }] },
        { id: 's-a3', tool: 'arrow', color: '#f59e0b', size: 3, points: [{ x: 380, y: 260 }, { x: 220, y: 340 }] },
        { id: 's-a4', tool: 'arrow', color: '#f43f5e', size: 3, points: [{ x: 540, y: 260 }, { x: 700, y: 340 }] },
      ],
      texts: [
        { id: 't-c1', x: 410, y: 245, text: 'CENTRAL TOPIC', color: '#ffffff', fontSize: 18 },
        { id: 't-b1', x: 150, y: 130, text: 'Key Subtopic 1', color: '#60a5fa', fontSize: 15 },
        { id: 't-b2', x: 700, y: 130, text: 'Key Subtopic 2', color: '#34d399', fontSize: 15 },
        { id: 't-b3', x: 150, y: 330, text: 'Vocabulary & Phrases', color: '#fbbf24', fontSize: 15 },
        { id: 't-b4', x: 700, y: 330, text: 'Practice Questions', color: '#fb7185', fontSize: 15 },
      ],
      stickies: [
        { id: 'stk-m1', x: 140, y: 150, text: 'Add supporting ideas...', color: '#bae6fd', author: 'Teacher' },
        { id: 'stk-m2', x: 690, y: 150, text: 'Student examples...', color: '#a7f3d0', author: 'Teacher' },
      ],
      images: []
    })
  },
  {
    id: 'cornell',
    name: 'Cornell Notes Template',
    category: 'Classroom Framework',
    description: 'Academic split layout with Cue Column, Main Notes area, and Bottom Summary section.',
    icon: '📑',
    gridPattern: 'lined',
    initialState: () => ({
      strokes: [
        // Vertical divider line for Cues
        { id: 's-v1', tool: 'line', color: '#a855f7', size: 3, points: [{ x: 260, y: 40 }, { x: 260, y: 420 }] },
        // Horizontal divider line for Summary
        { id: 's-h1', tool: 'line', color: '#a855f7', size: 3, points: [{ x: 20, y: 420 }, { x: 880, y: 420 }] },
      ],
      texts: [
        { id: 't-c1', x: 40, y: 70, text: 'CUES / QUESTIONS', color: '#c084fc', fontSize: 14 },
        { id: 't-c2', x: 280, y: 70, text: 'CLASS NOTES & EXPLANATIONS', color: '#93c5fd', fontSize: 14 },
        { id: 't-c3', x: 40, y: 450, text: 'SUMMARY / KEY TAKEAWAYS', color: '#34d399', fontSize: 14 },
      ],
      stickies: [
        { id: 'stk-c1', x: 40, y: 100, text: 'Q1: What is the main grammar rule for this unit?', color: '#fef08a', author: 'Cues' },
        { id: 'stk-c2', x: 280, y: 100, text: '• Present Perfect with ever / never\n• Used for life experiences', color: '#e9d5ff', author: 'Notes' },
      ],
      images: []
    })
  },
  {
    id: 'venn',
    name: 'Venn Comparison Diagram',
    category: 'Classroom Framework',
    description: 'Two large overlapping comparison circles for comparing concepts or tenses.',
    icon: '⚪',
    gridPattern: 'dots',
    initialState: () => ({
      strokes: [
        // Left Circle
        { id: 's-v1', tool: 'circle', color: '#3b82f6', size: 3, points: [{ x: 180, y: 120 }, { x: 540, y: 460 }] },
        // Right Circle
        { id: 's-v2', tool: 'circle', color: '#ec4899', size: 3, points: [{ x: 400, y: 120 }, { x: 760, y: 460 }] },
      ],
      texts: [
        { id: 't-v1', x: 240, y: 150, text: 'CONCEPT A', color: '#60a5fa', fontSize: 16 },
        { id: 't-v2', x: 620, y: 150, text: 'CONCEPT B', color: '#f472b6', fontSize: 16 },
        { id: 't-v3', x: 430, y: 170, text: 'COMMON', color: '#fbbf24', fontSize: 14 },
      ],
      stickies: [
        { id: 'stk-v1', x: 220, y: 220, text: 'Unique traits of A', color: '#bae6fd', author: 'Concept A' },
        { id: 'stk-v2', x: 600, y: 220, text: 'Unique traits of B', color: '#fecdd3', author: 'Concept B' },
        { id: 'stk-v3', x: 410, y: 250, text: 'Shared features', color: '#fef08a', author: 'Common' },
      ],
      images: []
    })
  },
  {
    id: 'kanban',
    name: '3-Column Brainstorm / Kanban',
    category: 'Classroom Framework',
    description: 'Three structured columns for To-Do / In Progress / Done or Discussion / Practice / Homework.',
    icon: '📊',
    gridPattern: 'grid',
    initialState: () => ({
      strokes: [
        { id: 's-k1', tool: 'line', color: '#475569', size: 2, points: [{ x: 300, y: 30 }, { x: 300, y: 520 }] },
        { id: 's-k2', tool: 'line', color: '#475569', size: 2, points: [{ x: 600, y: 30 }, { x: 600, y: 520 }] },
      ],
      texts: [
        { id: 't-k1', x: 40, y: 60, text: '1. KEY CONCEPTS', color: '#a855f7', fontSize: 15 },
        { id: 't-k2', x: 340, y: 60, text: '2. GUIDED PRACTICE', color: '#3b82f6', fontSize: 15 },
        { id: 't-k3', x: 640, y: 60, text: '3. HOMEWORK & TASKS', color: '#10b981', fontSize: 15 },
      ],
      stickies: [
        { id: 'stk-k1', x: 40, y: 90, text: 'Unit Vocabulary List\nPhrasal verbs', color: '#e9d5ff', author: 'Lesson' },
        { id: 'stk-k2', x: 340, y: 90, text: 'Speaking dialogue in pairs\nRoleplay scenarios', color: '#bae6fd', author: 'Practice' },
        { id: 'stk-k3', x: 640, y: 90, text: 'Workbook Page 34 Ex 1-4\nDue next session', color: '#a7f3d0', author: 'Homework' },
      ],
      images: []
    })
  },
  {
    id: 'cartesian',
    name: 'Cartesian Coordinate Plane',
    category: 'Classroom Framework',
    description: 'X & Y coordinate axes with scaled markers for graphs and formulas.',
    icon: '📈',
    gridPattern: 'grid',
    initialState: () => ({
      strokes: [
        // Horizontal X axis
        { id: 's-x1', tool: 'arrow', color: '#94a3b8', size: 2, points: [{ x: 60, y: 260 }, { x: 840, y: 260 }] },
        // Vertical Y axis
        { id: 's-y1', tool: 'arrow', color: '#94a3b8', size: 2, points: [{ x: 450, y: 500 }, { x: 450, y: 40 }] },
      ],
      texts: [
        { id: 't-x', x: 820, y: 290, text: '+X', color: '#cbd5e1', fontSize: 14 },
        { id: 't-y', x: 465, y: 55, text: '+Y', color: '#cbd5e1', fontSize: 14 },
        { id: 't-o', x: 435, y: 275, text: '(0,0)', color: '#a855f7', fontSize: 12 },
      ],
      stickies: [],
      images: []
    })
  }
];

interface HistoryEntry {
  strokes: WhiteboardStroke[];
  texts: WhiteboardText[];
  stickies: WhiteboardSticky[];
  images: WhiteboardImage[];
}

export default function VirtualWhiteboard({
  boardId = 'default',
  title = 'Interactive Virtual Whiteboard',
  authorName = 'Teacher',
  onShareToChat,
  onClose,
  initialState,
  heightClass = 'h-[580px]',
  showTeacherControls = false,
  onBrush,
  onSendCurrentBoard
}: VirtualWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadDone = useRef(false);

  // Tools
  const [selectedTool, setSelectedTool] = useState<
    'select' | 'pan' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'sticky'
  >('pen');

  const [selectedColor, setSelectedColor] = useState<string>('#a855f7');
  const [strokeSize, setStrokeSize] = useState<number>(3);
  const [gridPattern, setGridPattern] = useState<'dots' | 'grid' | 'lined' | 'none'>('dots');
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('dots');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan & Zoom Canvas State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Modals & UI States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [insertMenuTab, setInsertMenuTab] = useState<'shapes'|'annotations'|'emojis'>('shapes');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSnapEnabled, setIsSnapEnabled] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<WhiteboardStroke | null>(null);

  // Persistent Elements
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>(initialState?.strokes || []);
  const [texts, setTexts] = useState<WhiteboardText[]>(initialState?.texts || []);
  const [stickies, setStickies] = useState<WhiteboardSticky[]>(initialState?.stickies || []);
  const [images, setImages] = useState<WhiteboardImage[]>(initialState?.images || []);

  // History for Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Cloud Sync & Persistence State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Text insertion state
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Sticky drag state
  const [draggingStickyId, setDraggingStickyId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Zoom control helpers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.25, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    showToast('Canvas view reset to 100%');
  };

  // -------------------------------------------------------------
  // 1. HISTORY STACK (UNDO / REDO)
  // -------------------------------------------------------------
  const pushHistory = useCallback(() => {
    const currentSnapshot: HistoryEntry = {
      strokes: JSON.parse(JSON.stringify(strokes)),
      texts: JSON.parse(JSON.stringify(texts)),
      stickies: JSON.parse(JSON.stringify(stickies)),
      images: JSON.parse(JSON.stringify(images))
    };
    setHistory(prev => [...prev.slice(-40), currentSnapshot]);
    setRedoStack([]);
  }, [strokes, texts, stickies, images]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const currentSnapshot: HistoryEntry = {
      strokes: JSON.parse(JSON.stringify(strokes)),
      texts: JSON.parse(JSON.stringify(texts)),
      stickies: JSON.parse(JSON.stringify(stickies)),
      images: JSON.parse(JSON.stringify(images))
    };
    const previous = history[history.length - 1];

    setRedoStack(prev => [...prev, currentSnapshot]);
    setHistory(prev => prev.slice(0, prev.length - 1));

    setStrokes(previous.strokes);
    setTexts(previous.texts);
    setStickies(previous.stickies);
    setImages(previous.images);
  }, [history, strokes, texts, stickies, images]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const currentSnapshot: HistoryEntry = {
      strokes: JSON.parse(JSON.stringify(strokes)),
      texts: JSON.parse(JSON.stringify(texts)),
      stickies: JSON.parse(JSON.stringify(stickies)),
      images: JSON.parse(JSON.stringify(images))
    };
    const next = redoStack[redoStack.length - 1];

    setHistory(prev => [...prev, currentSnapshot]);
    setRedoStack(prev => prev.slice(0, prev.length - 1));

    setStrokes(next.strokes);
    setTexts(next.texts);
    setStickies(next.stickies);
    setImages(next.images);
  }, [redoStack, strokes, texts, stickies, images]);

  // Keyboard shortcut listener for Ctrl+Z (Undo), Ctrl+Y (Redo), Space (Pan), Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
        if (isTemplateModalOpen) setIsTemplateModalOpen(false);
        if (showExportMenu) setShowExportMenu(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, isFullscreen, isTemplateModalOpen, showExportMenu, isSpacePressed]);

  // Mouse wheel zoom & pan on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      const activeTag = ((e.target as HTMLElement)?.tagName || '').toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') {
        if (!e.ctrlKey && !e.metaKey) return;
      }
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;

        setZoom(prevZoom => {
          const newZoom = Math.min(4.0, Math.max(0.25, Number((prevZoom * zoomDelta).toFixed(2))));
          setPan(prevPan => ({
            x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
            y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom)
          }));
          return newZoom;
        });
      } else {
        setPan(prevPan => ({
          x: prevPan.x - e.deltaX,
          y: prevPan.y - e.deltaY
        }));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // -------------------------------------------------------------
  // 2. CANVAS RENDERING ENGINE (WITH PAN & ZOOM + TRUE ERASER CUTOUT)
  // -------------------------------------------------------------
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply High-DPI (Retina) scale and pan & zoom matrix
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // REWORKED ERASER: Truly erases pixels from the drawing layer using destination-out
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.lineWidth = stroke.size * 3.5;
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity || 0.35;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }

      if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.tool === 'line') {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (stroke.tool === 'arrow') {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headlen = stroke.size * 3.5 + 8;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headlen * Math.cos(angle - Math.PI / 6),
          end.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - headlen * Math.cos(angle + Math.PI / 6),
          end.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.tool === 'rect') {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.tool === 'circle') {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const radiusX = Math.abs(end.x - start.x) / 2;
        const radiusY = Math.abs(end.y - start.y) / 2;
        const centerX = Math.min(start.x, end.x) + radiusX;
        const centerY = Math.min(start.y, end.y) + radiusY;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    ctx.restore();
  }, [strokes, currentStroke, pan, zoom]);

  // Re-draw whenever visual elements change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Draw background pattern onto an export canvas
  const drawBackgroundOntoContext = useCallback((offCtx: CanvasRenderingContext2D, width: number, height: number) => {
    offCtx.fillStyle = '#0f172a'; // Base Slate-900 background
    offCtx.fillRect(0, 0, width, height);

    if (gridPattern === 'dots') {
      offCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let x = 12; x < width; x += 24) {
        for (let y = 12; y < height; y += 24) {
          offCtx.beginPath();
          offCtx.arc(x, y, 1.2, 0, Math.PI * 2);
          offCtx.fill();
        }
      }
    } else if (gridPattern === 'grid') {
      offCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      offCtx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        offCtx.beginPath();
        offCtx.moveTo(x, 0);
        offCtx.lineTo(x, height);
        offCtx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        offCtx.beginPath();
        offCtx.moveTo(0, y);
        offCtx.lineTo(width, y);
        offCtx.stroke();
      }
    } else if (gridPattern === 'lined') {
      // Ruled lined paper
      offCtx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; // Sky-400 lines
      offCtx.lineWidth = 1;
      for (let y = 36; y < height; y += 28) {
        offCtx.beginPath();
        offCtx.moveTo(0, y);
        offCtx.lineTo(width, y);
        offCtx.stroke();
      }
      // Red margin line
      offCtx.strokeStyle = 'rgba(244, 63, 94, 0.35)'; // Rose-500 margin
      offCtx.lineWidth = 1.5;
      offCtx.beginPath();
      offCtx.moveTo(64, 0);
      offCtx.lineTo(64, height);
      offCtx.stroke();
    }
  }, [gridPattern]);

  // Capture canvas state as a complete high-res PNG data URL image string
  const generateCanvasImageString = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return '';

    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return '';

    // Draw background
    drawBackgroundOntoContext(offCtx, offCanvas.width, offCanvas.height);

    // Draw drawn strokes from current canvas
    offCtx.drawImage(canvas, 0, 0);

    // Apply viewport transform for DOM-based elements
    offCtx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);

    // Render Texts
    texts.forEach(t => {
      offCtx.save();
      offCtx.font = `600 ${t.fontSize}px sans-serif`;
      offCtx.fillStyle = t.color;
      offCtx.fillText(t.text, t.x, t.y);
      offCtx.restore();
    });

    // Render Sticky Notes onto the exported canvas
    stickies.forEach(s => {
      offCtx.save();
      offCtx.fillStyle = s.color || '#fef08a';
      offCtx.strokeStyle = '#eab308';
      offCtx.lineWidth = 1;

      // Draw sticky note rect
      offCtx.fillRect(s.x, s.y, 180, 110);
      offCtx.strokeRect(s.x, s.y, 180, 110);

      // Sticky header
      offCtx.fillStyle = 'rgba(0,0,0,0.6)';
      offCtx.font = 'bold 10px sans-serif';
      offCtx.fillText(s.author || 'Note', s.x + 8, s.y + 16);

      // Sticky body text with word wrapping
      offCtx.fillStyle = '#1c1917';
      offCtx.font = '12px sans-serif';
      const words = s.text.split(' ');
      let line = '';
      let lineY = s.y + 34;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = offCtx.measureText(testLine);
        if (metrics.width > 164 && n > 0) {
          offCtx.fillText(line, s.x + 8, lineY);
          line = words[n] + ' ';
          lineY += 15;
          if (lineY > s.y + 100) break;
        } else {
          line = testLine;
        }
      }
      offCtx.fillText(line, s.x + 8, lineY);
      offCtx.restore();
    });

    offCtx.resetTransform();

    return offCanvas.toDataURL('image/png', 0.95);
  }, [drawBackgroundOntoContext, stickies, texts, zoom, pan]);

  // Capture lightweight compressed preview for Firestore
  const generateCompactPreview = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return '';

    const previewWidth = 320;
    const scale = previewWidth / canvas.width;
    const previewHeight = Math.max(160, Math.round(canvas.height * scale));

    const offCanvas = document.createElement('canvas');
    offCanvas.width = previewWidth;
    offCanvas.height = previewHeight;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return '';

    offCtx.fillStyle = '#0f172a';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    offCtx.drawImage(canvas, 0, 0, previewWidth, previewHeight);

    // Apply scaling and transform for DOM elements
    offCtx.scale(scale, scale);
    offCtx.setTransform(scale * zoom, 0, 0, scale * zoom, scale * pan.x, scale * pan.y);

    texts.forEach(t => {
      offCtx.save();
      offCtx.font = `600 ${t.fontSize}px sans-serif`;
      offCtx.fillStyle = t.color;
      offCtx.fillText(t.text, t.x, t.y);
      offCtx.restore();
    });

    stickies.forEach(s => {
      offCtx.save();
      offCtx.fillStyle = s.color || '#fef08a';
      offCtx.fillRect(s.x, s.y, 180, 110);
      offCtx.fillStyle = '#1c1917';
      offCtx.font = '12px sans-serif';
      offCtx.fillText(s.text.substring(0, 20) + (s.text.length > 20 ? '...' : ''), s.x + 8, s.y + 24);
      offCtx.restore();
    });

    offCtx.resetTransform();

    return offCanvas.toDataURL('image/jpeg', 0.7);
  }, [texts, stickies, zoom, pan]);

  // -------------------------------------------------------------
  // 3. FIRESTORE PERSISTENCE & AUTO-SAVE
  // -------------------------------------------------------------
  const isRemoteUpdateRef = useRef(false);
  const lastSyncedJsonRef = useRef<string>('');
  const isSavingInProgressRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const storageKey = `vault_whiteboard_${boardId}`;

    const localCached = localStorage.getItem(storageKey);
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        if (parsed.strokes) setStrokes(parsed.strokes);
        if (parsed.texts) setTexts(parsed.texts);
        if (parsed.stickies) setStickies(parsed.stickies);
        if (parsed.images) setImages(parsed.images);
        lastSyncedJsonRef.current = JSON.stringify({
          strokes: parsed.strokes || [],
          texts: parsed.texts || [],
          stickies: parsed.stickies || [],
          images: parsed.images || []
        });
      } catch (err) {
        console.warn('Could not parse local whiteboard cache', err);
      }
    }

    const docRef = doc(db, 'app_state', `whiteboard_${boardId}`);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data() as WhiteboardState;
          const currentSnapshotJson = JSON.stringify({
            strokes: data.strokes || [],
            texts: data.texts || [],
            stickies: data.stickies || [],
            images: data.images || []
          });

          if (currentSnapshotJson === lastSyncedJsonRef.current) {
            isInitialLoadDone.current = true;
            return;
          }

          isRemoteUpdateRef.current = true;
          lastSyncedJsonRef.current = currentSnapshotJson;

          if (data.strokes) setStrokes(data.strokes);
          if (data.texts) setTexts(data.texts);
          if (data.stickies) setStickies(data.stickies);
          if (data.images) setImages(data.images);
          if (data.updatedAt) {
            setLastSavedTime(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          setSaveStatus('saved');
        }
        isInitialLoadDone.current = true;
      },
      (error) => {
        console.error('Firestore whiteboard subscription error:', error);
        isInitialLoadDone.current = true;
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [boardId]);

  const triggerAutoSave = useCallback(() => {
    if (!isInitialLoadDone.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingInProgressRef.current) return;

      const currentJson = JSON.stringify({ strokes, texts, stickies, images });
      if (currentJson === lastSyncedJsonRef.current) {
        setSaveStatus('saved');
        return;
      }

      try {
        isSavingInProgressRef.current = true;
        const compactImageString = generateCompactPreview();
        const fullImageString = generateCanvasImageString();

        const localPayload: WhiteboardState = {
          strokes,
          texts,
          stickies,
          images,
          imageString: fullImageString,
          updatedAt: new Date().toISOString()
        };

        const cloudPayload: WhiteboardState = {
          strokes,
          texts,
          stickies,
          images,
          imageString: compactImageString,
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(`vault_whiteboard_${boardId}`, JSON.stringify(localPayload));

        lastSyncedJsonRef.current = currentJson;
        const docRef = doc(db, 'app_state', `whiteboard_${boardId}`);
        const sanitizedCloudPayload = JSON.parse(JSON.stringify(cloudPayload));
        await setDoc(docRef, sanitizedCloudPayload, { merge: true });

        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (error) {
        console.error('Error auto-saving whiteboard to Firestore:', error);
        setSaveStatus('error');
      } finally {
        isSavingInProgressRef.current = false;
      }
    }, 1000);
  }, [boardId, strokes, texts, stickies, images, generateCompactPreview, generateCanvasImageString]);

  useEffect(() => {
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (isInitialLoadDone.current) {
      triggerAutoSave();
    }
  }, [strokes, texts, stickies, images, triggerAutoSave]);

  // -------------------------------------------------------------
  // 4. DOWNLOAD AS PDF & PNG
  // -------------------------------------------------------------
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      setShowExportMenu(false);

      const highResImage = generateCanvasImageString();
      if (!highResImage) {
        showToast('Cannot export empty canvas.');
        setIsExportingPDF(false);
        return;
      }

      // Initialize landscape A4 PDF: 297mm width x 210mm height
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 12;

      // PDF Background
      pdf.setFillColor(15, 23, 42); // #0f172a
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Top Header Banner
      pdf.setFillColor(30, 41, 59); // #1e293b
      pdf.roundedRect(margin, margin, pageWidth - margin * 2, 22, 3, 3, 'F');

      // Title & School Vault Brand
      pdf.setTextColor(241, 245, 249);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(title, margin + 6, margin + 9);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Teacher / Author: ${authorName}   •   Session Board ID: ${boardId}`, margin + 6, margin + 16);

      const dateStr = new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.setFontSize(9);
      pdf.setTextColor(192, 132, 252);
      pdf.text(dateStr, pageWidth - margin - 6, margin + 12, { align: 'right' });

      // Embed Canvas Image into PDF
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = pageHeight - margin * 2 - 28 - 10;
      const imgY = margin + 26;

      pdf.addImage(highResImage, 'PNG', margin, imgY, imgWidth, imgHeight, undefined, 'FAST');

      // Outer border around canvas image
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(margin, imgY, imgWidth, imgHeight, 2, 2, 'D');

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        'School Vault Virtual Whiteboard Studio   •   Confidential Classroom Documentation   •   Page 1 of 1',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );

      const safeFilename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(safeFilename);
      showToast('Whiteboard successfully downloaded as PDF!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Error generating PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportPNG = () => {
    setShowExportMenu(false);
    const dataUrl = generateCanvasImageString();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
    showToast('PNG image downloaded!');
  };

  // -------------------------------------------------------------
  // 5. TEMPLATE SELECTION & INITIALIZATION
  // -------------------------------------------------------------
  const handleApplyTemplate = (tmpl: PredefinedTemplate) => {
    pushHistory();
    setGridPattern(tmpl.gridPattern);
    setActiveTemplate(tmpl.id);

    if (tmpl.initialState) {
      const state = tmpl.initialState();
      setStrokes(state.strokes || []);
      setTexts(state.texts || []);
      setStickies(state.stickies || []);
      setImages(state.images || []);
    } else {
      // Background only template: keep existing items or reset
      // We don't wipe strokes if it's just a background
    }

    setIsTemplateModalOpen(false);
    showToast(`Applied "${tmpl.name}" template!`);
  };

  // -------------------------------------------------------------
  // 6. TEACHER BRUSH & SEND ACTIONS
  // -------------------------------------------------------------
  const handleTeacherBrush = () => {
    pushHistory();
    const fullImage = generateCanvasImageString();
    const snapshotData: WhiteboardSnapshotData = {
      imageDataUrl: fullImage,
      state: {
        strokes: [...strokes],
        texts: [...texts],
        stickies: [...stickies],
        images: [...images],
        imageString: fullImage,
        updatedAt: new Date().toISOString()
      },
      title: `${title} (Brush Archive)`,
      timestamp: new Date().toISOString()
    };

    if (onBrush) {
      onBrush(snapshotData);
    }

    // Empty the board completely
    setStrokes([]);
    setTexts([]);
    setStickies([]);
    setImages([]);
    setCurrentStroke(null);
    setActiveTextInput(null);
    showToast('Board emptied & saved to PDF Collection and Group Archive!');
  };

  const handleTeacherSendCurrentBoard = () => {
    const fullImage = generateCanvasImageString();
    const snapshotData: WhiteboardSnapshotData = {
      imageDataUrl: fullImage,
      state: {
        strokes: [...strokes],
        texts: [...texts],
        stickies: [...stickies],
        images: [...images],
        imageString: fullImage,
        updatedAt: new Date().toISOString()
      },
      title: `${title} (Class Snapshot)`,
      timestamp: new Date().toISOString()
    };

    if (onSendCurrentBoard) {
      onSendCurrentBoard(snapshotData);
    }

    showToast('Current board saved to Collection & Group Class archive!');
  };

  // -------------------------------------------------------------
  // 7. FULL-SCREEN TOGGLE & RESIZING
  // -------------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.offsetWidth;
        const height = canvasRef.current.offsetHeight;
        if (width > 0 && height > 0) {
          const dpr = window.devicePixelRatio || 1;
          canvasRef.current.width = width * dpr;
          canvasRef.current.height = height * dpr;
          redrawCanvas();
        }
      }
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (canvasRef.current && canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isFullscreen, redrawCanvas]);

  // -------------------------------------------------------------
  // 8. DRAWING & POINTER HANDLERS (WITH PAN & ZOOM MATH)
  // -------------------------------------------------------------
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent, applySnapping = false) => {
    if (!canvasRef.current) return { x: 0, y: 0, screenX: 0, screenY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : (e as React.MouseEvent).clientY;
    
    // Un-scale coords if CSS transform is active
    const scaleX = canvasRef.current.offsetWidth / rect.width;
    const scaleY = canvasRef.current.offsetHeight / rect.height;
    
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;
    
    let worldX = (screenX - pan.x) / zoom;
    let worldY = (screenY - pan.y) / zoom;
    
    if (applySnapping && isSnapEnabled) {
      worldX = Math.round(worldX / 20) * 20;
      worldY = Math.round(worldY / 20) * 20;
    }

    return {
      x: worldX,
      y: worldY,
      screenX,
      screenY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const isMiddleClick = 'button' in e && (e as React.MouseEvent).button === 1;
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : (e as React.MouseEvent).clientY;

    // Check if panning mode is active
    if (selectedTool === 'pan' || isSpacePressed || isMiddleClick) {
      setIsPanning(true);
      setPanStart({
        x: clientX - pan.x,
        y: clientY - pan.y
      });
      return;
    }

    if (selectedTool === 'select') return;

    const shouldSnap = ['rect', 'circle', 'line', 'arrow'].includes(selectedTool);
    const coords = getCanvasCoords(e, shouldSnap);

    if (selectedTool === 'text') {
      setActiveTextInput({ x: coords.x, y: coords.y, text: '' });
      return;
    }

    if (selectedTool === 'sticky') {
      pushHistory();
      const newSticky: WhiteboardSticky = {
        id: `stk-${Date.now()}`,
        x: Math.max(10, coords.x - 70),
        y: Math.max(10, coords.y - 40),
        text: 'Class note or observation...',
        color: '#fef08a',
        author: authorName
      };
      setStickies(prev => [...prev, newSticky]);
      setSelectedTool('select');
      return;
    }

    setIsDrawing(true);
    setCurrentStroke({
      id: `strk-${Date.now()}`,
      tool: selectedTool,
      points: [coords],
      color: selectedColor,
      size: strokeSize,
      opacity: selectedTool === 'highlighter' ? 0.35 : 1
    });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : (e as React.MouseEvent).clientY;

    if (isPanning) {
      setPan({
        x: clientX - panStart.x,
        y: clientY - panStart.y
      });
      return;
    }

    if (!isDrawing || !currentStroke) return;
    const shouldSnap = ['rect', 'circle', 'line', 'arrow'].includes(currentStroke.tool);
    const coords = getCanvasCoords(e, shouldSnap);

    if (currentStroke.tool === 'pen' || currentStroke.tool === 'highlighter' || currentStroke.tool === 'eraser') {
      setCurrentStroke(prev => prev ? {
        ...prev,
        points: [...prev.points, coords]
      } : null);
    } else {
      setCurrentStroke(prev => prev ? {
        ...prev,
        points: [prev.points[0], coords]
      } : null);
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke && currentStroke.points.length > 0) {
      pushHistory();
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  // Sticky Dragging in world coordinates
  
  const handleStickyMouseMove = (e: React.MouseEvent) => {
    if ((!draggingStickyId && !draggingTextId) || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const scaleX = containerRef.current.offsetWidth / rect.width;
    const scaleY = containerRef.current.offsetHeight / rect.height;
    
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    const worldX = (screenX - pan.x) / zoom - dragOffset.x;
    const worldY = (screenY - pan.y) / zoom - dragOffset.y;
    
    const finalX = isSnapEnabled ? Math.round(worldX / 20) * 20 : worldX;
    const finalY = isSnapEnabled ? Math.round(worldY / 20) * 20 : worldY;

    if (draggingStickyId) {
       setStickies(prev => prev.map(s => s.id === draggingStickyId ? { ...s, x: finalX, y: finalY } : s));
    } else if (draggingTextId) {
       setTexts(prev => prev.map(t => t.id === draggingTextId ? { ...t, x: finalX, y: finalY } : t));
    }
  };

  const handleStickyMouseUp = () => {
    if (draggingStickyId) setDraggingStickyId(null);
    if (draggingTextId) setDraggingTextId(null);
  };

  // Image Upload & Paste
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert(`Image is too large (max 800KB). Please use a smaller image.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pushHistory();
      const img = new Image();
      img.onload = () => {
        const maxWidth = 260;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const newImg: WhiteboardImage = {
          id: `img-${Date.now()}`,
          x: 40 + Math.random() * 80,
          y: 40 + Math.random() * 60,
          width: img.width * scale,
          height: img.height * scale,
          url: reader.result as string,
          name: file.name
        };
        setImages(prev => [...prev, newImg]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFinishText = () => {
    if (!activeTextInput || !activeTextInput.text.trim()) {
      setActiveTextInput(null);
      return;
    }
    pushHistory();
    const newText: WhiteboardText = {
      id: `txt-${Date.now()}`,
      x: activeTextInput.x,
      y: activeTextInput.y,
      text: activeTextInput.text.trim(),
      color: selectedColor,
      fontSize: strokeSize <= 2 ? 14 : strokeSize <= 4 ? 18 : strokeSize <= 8 ? 24 : 36
    };
    setTexts(prev => [...prev, newText]);
    setActiveTextInput(null);
  };

  const handleClearAll = () => {
    if (strokes.length === 0 && texts.length === 0 && stickies.length === 0 && images.length === 0) return;
    pushHistory();
    setStrokes([]);
    setTexts([]);
    setStickies([]);
    setImages([]);
    setCurrentStroke(null);
    setActiveTextInput(null);
    showToast('Whiteboard cleared (Use Undo to restore)');
  };

  const handleShareToChat = () => {
    if (!onShareToChat) return;
    const imgUrl = generateCanvasImageString();
    if (!imgUrl) return;
    onShareToChat(imgUrl, `Virtual Whiteboard snapshot for "${title}"`);
    showToast('Posted snapshot to class chat!');
  };

  return (
    <div 
      id={`whiteboard-container-${boardId}`}
      ref={containerRef}
      onMouseMove={handleStickyMouseMove}
      onMouseUp={handleStickyMouseUp}
      className={`relative flex flex-col bg-slate-950 rounded-2xl border border-brand-border overflow-hidden select-none shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : heightClass
      }`}
    >
      {/* HIDDEN FILE INPUT */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-purple-900/90 text-purple-100 border border-purple-400/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & TOOLBAR */}
      <header 
        id="whiteboard-header"
        className="px-4 py-2.5 bg-slate-900/95 border-b border-brand-border/80 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-sm"
      >
        {/* Left: Title & Cloud Auto-Save Status */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs md:text-sm font-bold text-slate-100 flex items-center gap-1.5 line-clamp-1">
                <span>{title}</span>
              </h4>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase">
                Live
              </span>
            </div>
            
            {/* Auto-Save to Firestore Indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              {saveStatus === 'saving' ? (
                <span className="flex items-center text-amber-400 gap-1 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center text-emerald-400 gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}</span>
                </span>
              ) : (
                <span className="flex items-center text-slate-400 gap-1">
                  <Cloud className="w-3 h-3 text-purple-400" />
                  <span>Auto-saved to Cloud</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Tools Tray */}
        <div className="flex items-center bg-slate-900/90 border border-brand-border rounded-xl p-1 gap-1">
          {/* Select Tool */}
          <button
            id="wb-tool-select"
            onClick={() => setSelectedTool('select')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedTool === 'select' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Select & Move Sticky Notes / Images"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Pan / Hand Tool */}
          <button
            id="wb-tool-pan"
            onClick={() => setSelectedTool('pan')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedTool === 'pan' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Pan Tool (Hold Space or Click & Drag canvas)"
          >
            <Hand className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-brand-border mx-0.5" />

          {/* Pen Tool */}
          <button
            id="wb-tool-pen"
            onClick={() => setSelectedTool('pen')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedTool === 'pen' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Freehand Pen"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Highlighter */}
          <button
            id="wb-tool-highlighter"
            onClick={() => setSelectedTool('highlighter')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedTool === 'highlighter' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Highlighter (Semi-transparent)"
          >
            <Highlighter className="w-4 h-4" />
          </button>


          {/* Eraser (Real Cutout) */}
          <button
            id="wb-tool-eraser"
            onClick={() => setSelectedTool('eraser')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedTool === 'eraser' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Precision Eraser (Erases drawing layer & deletes clicked notes)"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-brand-border mx-0.5" />

          {/* Geometric Shapes */}
          
          {/* Text Tool */}
          <button
            id="wb-tool-text"
            onClick={() => setSelectedTool('text')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              selectedTool === 'text' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Insert Text"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* INSERT MENU (Shapes, Emojis, Annotations) */}
          <div className="relative">
            <button
              id="wb-tool-insert"
              onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                isInsertMenuOpen || ['line', 'arrow', 'rect', 'circle', 'sticky'].includes(selectedTool) ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Insert Shapes, Annotations, Emojis"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            
            {isInsertMenuOpen && (
              <div className="absolute top-12 left-0 w-64 bg-slate-900 border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="flex border-b border-brand-border">
                  <button onClick={() => setInsertMenuTab('shapes')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition ${insertMenuTab === 'shapes' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-white/5'}`}>Shapes</button>
                  <button onClick={() => setInsertMenuTab('annotations')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition ${insertMenuTab === 'annotations' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-white/5'}`}>Notes</button>
                  <button onClick={() => setInsertMenuTab('emojis')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition ${insertMenuTab === 'emojis' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-white/5'}`}>Emojis</button>
                </div>
                
                <div className="p-3">
                  {insertMenuTab === 'shapes' && (
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => { setSelectedTool('rect'); setIsInsertMenuOpen(false); }} className={`p-2 rounded flex flex-col items-center gap-1 ${selectedTool === 'rect' ? 'bg-purple-500/30' : 'hover:bg-white/5'}`}><Square className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Rect</span></button>
                      <button onClick={() => { setSelectedTool('circle'); setIsInsertMenuOpen(false); }} className={`p-2 rounded flex flex-col items-center gap-1 ${selectedTool === 'circle' ? 'bg-purple-500/30' : 'hover:bg-white/5'}`}><Circle className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Circle</span></button>
                      <button onClick={() => { setSelectedTool('line'); setIsInsertMenuOpen(false); }} className={`p-2 rounded flex flex-col items-center gap-1 ${selectedTool === 'line' ? 'bg-purple-500/30' : 'hover:bg-white/5'}`}><Minus className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Line</span></button>
                      <button onClick={() => { setSelectedTool('arrow'); setIsInsertMenuOpen(false); }} className={`p-2 rounded flex flex-col items-center gap-1 ${selectedTool === 'arrow' ? 'bg-purple-500/30' : 'hover:bg-white/5'}`}><ArrowRight className="w-5 h-5 text-slate-300" /><span className="text-[9px] text-slate-400">Arrow</span></button>
                    </div>
                  )}
                  {insertMenuTab === 'annotations' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setSelectedTool('sticky'); setIsInsertMenuOpen(false); }} className={`p-2 rounded flex flex-col items-center gap-2 border border-slate-700 ${selectedTool === 'sticky' ? 'bg-amber-500/20 border-amber-500' : 'hover:bg-white/5'}`}>
                        <StickyNote className="w-6 h-6 text-amber-400" />
                        <span className="text-[10px] text-slate-300">Sticky Note</span>
                      </button>
                      <button onClick={() => { document.getElementById('wb-tool-image')?.click(); setIsInsertMenuOpen(false); }} className="p-2 rounded flex flex-col items-center gap-2 border border-slate-700 hover:bg-white/5">
                        <ImageIcon className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] text-slate-300">Image</span>
                      </button>
                    </div>
                  )}
                  {insertMenuTab === 'emojis' && (
                    <div className="grid grid-cols-6 gap-1 h-32 overflow-y-auto">
                      {['👍','👎','❤️','🔥','⭐','🎉','💡','🚀','👀','✅','❌','💯','😄','🤔','🙌','👏','🎨','📝','🔍','📌','⭐','⚠️','⛔','✅'].map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => {
                             pushHistory();
                             const newText = {
                                id: `txt-${Date.now()}`,
                                x: -pan.x / zoom + (containerRef.current?.clientWidth || 800) / 2 / zoom,
                                y: -pan.y / zoom + (containerRef.current?.clientHeight || 600) / 2 / zoom,
                                text: emoji,
                                color: selectedColor,
                                fontSize: 48
                             };
                             setTexts(prev => [...prev, newText]);
                             setIsInsertMenuOpen(false);
                          }}
                          className="text-2xl hover:bg-white/10 rounded transition cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


          <button
            id="wb-tool-image"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Upload Image"
          >
            <ImageIcon className="w-4 h-4 text-sky-400" />
          </button>

          {/* TEMPLATES BUTTON */}
          <button
            id="wb-tool-templates"
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-purple-900/40 border border-purple-500/40 text-purple-300 hover:bg-purple-800/60 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer ml-1"
            title="Select Predefined Template (Grid, Lined, Mind Map, Cornell Notes...)"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>
        </div>

        {/* Color Palette & Stroke Size */}
        <div className="flex items-center space-x-2">
          {/* Colors */}
          <div className="flex items-center bg-slate-900/90 border border-brand-border rounded-xl p-1 gap-1">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                  selectedColor === c ? 'scale-125 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                }`}
                title={`Color: ${c}`}
              />
            ))}
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <input 
              type="color" 
              value={selectedColor} 
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent overflow-hidden"
              title="Custom Color"
            />
          </div>

          {/* Stroke Width */}
          <div className="flex items-center bg-slate-900/90 border border-brand-border rounded-xl p-1 gap-1">
            {[1, 3, 6, 12, 24, 48].map(sz => (
              <button
                key={sz}
                onClick={() => setStrokeSize(sz)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  strokeSize === sz ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={`Stroke Width: ${sz}px`}
              >
                {sz}px
              </button>
            ))}
          </div>
        </div>

        {/* Right Actions: Teacher Controls, Undo, Redo, Share, Export PDF, Full-Screen */}
        <div className="flex items-center gap-1.5">
          {/* TEACHER SPECIFIC CONTROLS (BRUSH & SEND CURRENT BOARD) */}
          {showTeacherControls && (
            <div className="flex items-center gap-1.5 bg-brand-dark/90 border border-purple-500/40 p-1 rounded-xl">
              {/* Brush Button (Empty board & save to PDF collection) */}
              <button
                id="wb-teacher-brush-btn"
                onClick={handleTeacherBrush}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Brush: Clear board and save current snapshot to Unit Slideshow PDF Collection and Group Archive"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Brush</span>
              </button>

              {/* Send Current Board Button (Save to group collection without erasing) */}
              <button
                id="wb-teacher-send-board-btn"
                onClick={handleTeacherSendCurrentBoard}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white text-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Send Current Board: Save snapshot to this Group's collection archive without erasing"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send Board</span>
              </button>
            </div>
          )}

          <div className="w-px h-4 bg-brand-border mx-0.5" />

          {/* SNAP TO GRID BUTTON */}
          <button
            onClick={() => setIsSnapEnabled(!isSnapEnabled)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isSnapEnabled ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={`Snap to Grid ${isSnapEnabled ? '(On)' : '(Off)'}`}
          >
            <Magnet className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-brand-border mx-0.5" />

          {/* UNDO BUTTON */}
          <button
            id="wb-btn-undo"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg bg-slate-900 border border-brand-border text-slate-300 hover:text-white hover:bg-purple-500/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer relative group/undo"
            title={`Undo (Ctrl+Z) ${history.length > 0 ? `• ${history.length} step(s) available` : ''}`}
          >
            <Undo2 className="w-4 h-4" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-purple-600 text-white text-[8px] font-bold rounded-full font-mono">
                {history.length}
              </span>
            )}
          </button>

          {/* REDO BUTTON */}
          <button
            id="wb-btn-redo"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg bg-slate-900 border border-brand-border text-slate-300 hover:text-white hover:bg-purple-500/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer relative group/redo"
            title={`Redo (Ctrl+Y) ${redoStack.length > 0 ? `• ${redoStack.length} step(s) available` : ''}`}
          >
            <Redo2 className="w-4 h-4" />
            {redoStack.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-indigo-600 text-white text-[8px] font-bold rounded-full font-mono">
                {redoStack.length}
              </span>
            )}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-900 border border-brand-border rounded-xl p-0.5 gap-0.5">
            <button
              id="wb-btn-zoom-out"
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="wb-btn-zoom-reset"
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-purple-300 hover:bg-purple-600/20 hover:text-white transition cursor-pointer"
              title="Click to Reset View (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              id="wb-btn-zoom-in"
              onClick={handleZoomIn}
              disabled={zoom >= 4.0}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="wb-btn-zoom-fit"
              onClick={handleResetZoom}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Reset Pan & Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-brand-border mx-0.5" />

          {/* Grid Style Quick Cycle */}
          <button
            id="wb-btn-grid"
            onClick={() => setGridPattern(prev => prev === 'dots' ? 'grid' : prev === 'grid' ? 'lined' : prev === 'lined' ? 'none' : 'dots')}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              gridPattern !== 'none' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-slate-900 border-brand-border text-slate-400 hover:text-white'
            }`}
            title={`Background Pattern: ${gridPattern}`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Post to Chat Button */}
          {onShareToChat && (
            <button
              id="wb-btn-share-chat"
              onClick={handleShareToChat}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Post Snapshot to Active Class Chat"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Post to Chat</span>
            </button>
          )}

          {/* DOWNLOAD MENU (PDF & PNG) */}
          <div className="relative">
            <button
              id="wb-btn-download-menu"
              onClick={() => setShowExportMenu(prev => !prev)}
              className="p-1.5 rounded-lg bg-slate-900 border border-brand-border text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
              title="Export & Download Options (PDF, PNG)"
            >
              <Download className="w-4 h-4 text-purple-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-brand-border rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-fadeIn">
                <button
                  id="wb-btn-download-pdf"
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-purple-600 hover:text-white flex items-center gap-2 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="block">Download as PDF</span>
                    <span className="text-[10px] text-slate-400 font-normal">Formatted document</span>
                  </div>
                </button>

                <button
                  id="wb-btn-download-png"
                  onClick={handleExportPNG}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-purple-600 hover:text-white flex items-center gap-2 transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="block">Download as PNG</span>
                    <span className="text-[10px] text-slate-400 font-normal">High-res image</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Clear Board */}
          <button
            id="wb-btn-clear"
            onClick={handleClearAll}
            className="p-1.5 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
            title="Clear Whiteboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* FULL-SCREEN TOGGLE BUTTON */}
          <button
            id="wb-btn-fullscreen-toggle"
            onClick={toggleFullscreen}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              isFullscreen 
                ? 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white ring-2 ring-purple-500/40' 
                : 'bg-slate-900 hover:bg-purple-900/40 border-purple-500/40 text-purple-300 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Expand to Full Screen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline font-medium">
              {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            </span>
          </button>

          {onClose && (
            <button
              id="wb-btn-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
              title="Close Board"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* FULLSCREEN HELPER FLOATING BANNER */}
      {isFullscreen && (
        <div className="absolute top-16 right-6 z-30 bg-slate-900/90 border border-purple-500/40 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs text-slate-300 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Full Screen Drawing Mode • Press <strong>Esc</strong> to exit</span>
          <button 
            onClick={toggleFullscreen}
            className="p-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[10px] font-bold ml-1 transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      )}

      {/* CANVAS CONTAINER */}
      <div 
        className={`relative flex-1 bg-slate-950 overflow-hidden select-none cursor-${
          selectedTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') :
          isSpacePressed ? (isPanning ? 'grabbing' : 'grab') :
          selectedTool === 'pen' || selectedTool === 'highlighter' ? 'crosshair' :
          selectedTool === 'eraser' ? 'cell' :
          selectedTool === 'text' ? 'text' : 'default'
        }`}
        style={{
          backgroundImage: gridPattern === 'dots' 
            ? 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)' 
            : gridPattern === 'grid' 
            ? 'linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)' 
            : gridPattern === 'lined'
            ? 'linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)'
            : 'none',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: gridPattern === 'lined' ? `100% ${Math.max(12, 28 * zoom)}px` : `${Math.max(10, 24 * zoom)}px ${Math.max(10, 24 * zoom)}px`
        }}
      >
        {/* Margin Guide Line for Lined Paper */}
        {gridPattern === 'lined' && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500/30 pointer-events-none z-0" 
            style={{ left: `${64 * zoom + pan.x}px` }}
          />
        )}

        <canvas
          id="whiteboard-canvas"
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="absolute inset-0 w-full h-full touch-none z-10"
        />

        {/* WORLD COORDINATES LAYER (STICKIES, IMAGES, TEXT INPUT) */}
        <div 
          className="absolute inset-0 pointer-events-none origin-top-left z-20"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >

          {/* DRAGGABLE / EDITABLE TEXTS */}
          {texts.map(text => (
            <div
              key={text.id}
              style={{ left: `${text.x}px`, top: `${text.y}px`, color: text.color, fontSize: `${text.fontSize}px` }}
              className="absolute pointer-events-auto group cursor-move select-none animate-fadeIn"
              onMouseDown={(e) => {
                if (selectedTool === 'eraser') {
                  pushHistory();
                  setTexts(prev => prev.filter(t => t.id !== text.id));
                  return;
                }
                if (editingTextId === text.id) return;
                pushHistory();
                setDraggingTextId(text.id);
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect || !containerRef.current) return;
                
                const scaleX = containerRef.current.offsetWidth / rect.width;
                const scaleY = containerRef.current.offsetHeight / rect.height;
                
                const screenX = (e.clientX - rect.left) * scaleX;
                const screenY = (e.clientY - rect.top) * scaleY;
                const worldX = (screenX - pan.x) / zoom;
                const worldY = (screenY - pan.y) / zoom;
                setDragOffset({
                  x: worldX - text.x,
                  y: worldY - text.y
                });
              }}
              onDoubleClick={() => setEditingTextId(text.id)}
            >
              {editingTextId === text.id ? (
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-md border border-purple-500">
                  <input
                    autoFocus
                    type="text"
                    value={text.text}
                    onChange={(e) => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, text: e.target.value } : t))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingTextId(null);
                    }}
                    className="bg-transparent font-semibold text-inherit focus:outline-none w-48"
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, fontSize: t.fontSize + 2 } : t))} className="bg-slate-700 hover:bg-slate-600 rounded px-1 text-[10px] text-white">+</button>
                    <button onClick={() => setTexts(prev => prev.map(t => t.id === text.id ? { ...t, fontSize: Math.max(10, t.fontSize - 2) } : t))} className="bg-slate-700 hover:bg-slate-600 rounded px-1 text-[10px] text-white">-</button>
                  </div>
                  <button onClick={() => setEditingTextId(null)} className="p-1 bg-purple-600 hover:bg-purple-500 text-white rounded">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -top-6 -right-6 opacity-0 group-hover:opacity-100 transition z-30 flex gap-1 bg-slate-900/90 rounded-md p-1 border border-brand-border">
                    <button
                      onClick={() => setEditingTextId(text.id)}
                      className="p-1 hover:text-sky-400 transition cursor-pointer text-slate-300"
                      title="Edit Text"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        pushHistory();
                        setTexts(prev => prev.filter(t => t.id !== text.id));
                      }}
                      className="p-1 hover:text-rose-400 transition cursor-pointer text-slate-300"
                      title="Delete Text"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-semibold whitespace-pre font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{text.text}</span>
                </div>
              )}
            </div>
          ))}

          {/* DRAGGABLE / EDITABLE STICKY NOTES */}
          {stickies.map(sticky => (
            <div
              key={sticky.id}
              id={`sticky-${sticky.id}`}
              style={{ left: `${sticky.x}px`, top: `${sticky.y}px` }}
              className={`absolute pointer-events-auto w-44 rounded-xl p-3 shadow-xl border flex flex-col group cursor-move select-none animate-fadeIn ${STICKY_COLORS.find(c => c.hex === sticky.color)?.bg || 'bg-amber-300 text-amber-950 border-amber-400'}`}
              onMouseDown={(e) => {
                if (selectedTool === 'eraser') {
                  pushHistory();
                  setStickies(prev => prev.filter(s => s.id !== sticky.id));
                  return;
                }
                if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') return;
                pushHistory();
                setDraggingStickyId(sticky.id);
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect || !containerRef.current) return;
                
                const scaleX = containerRef.current.offsetWidth / rect.width;
                const scaleY = containerRef.current.offsetHeight / rect.height;
                
                const screenX = (e.clientX - rect.left) * scaleX;
                const screenY = (e.clientY - rect.top) * scaleY;
                const worldX = (screenX - pan.x) / zoom;
                const worldY = (screenY - pan.y) / zoom;
                setDragOffset({
                  x: worldX - sticky.x,
                  y: worldY - sticky.y
                });
              }}
            >
              <div className="flex flex-col gap-1 pb-1 border-b border-black/10 mb-1">
                <div className="flex items-center justify-between text-[10px] font-bold opacity-70">
                  <span>{sticky.author || 'Sticky Note'}</span>
                  <button
                    onClick={() => {
                      pushHistory();
                      setStickies(prev => prev.filter(s => s.id !== sticky.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-700 transition cursor-pointer"
                    title="Delete note"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {STICKY_COLORS.map(c => (
                     <button
                       key={c.hex}
                       onClick={() => { pushHistory(); setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, color: c.hex } : s)); }}
                       className={`w-3 h-3 rounded-full border border-black/20 ${c.bg.split(' ')[0]} hover:scale-110 transition`}
                       title={c.label}
                     />
                   ))}
                </div>
              </div>
              <textarea
                value={sticky.text}
                onChange={(e) => {
                  const val = e.target.value;
                  setStickies(prev => prev.map(s => s.id === sticky.id ? { ...s, text: val } : s));
                }}
                onFocus={() => {
                  pushHistory();
                }}
                rows={3}
                className="w-full bg-transparent resize-none text-xs font-medium text-amber-950 placeholder-amber-900/40 focus:outline-none"
                placeholder="Type note..."
              />
            </div>
          ))}

          {/* SHARED IMAGES PLACED ON BOARD */}
          {images.map(img => (
            <div
              key={img.id}
              id={`wb-image-${img.id}`}
              style={{ left: `${img.x}px`, top: `${img.y}px`, width: `${img.width}px` }}
              className="absolute pointer-events-auto rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-2xl group bg-slate-900 cursor-move"
              onMouseDown={() => {
                if (selectedTool === 'eraser') {
                  pushHistory();
                  setImages(prev => prev.filter(i => i.id !== img.id));
                }
              }}
            >
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition z-30 flex gap-1">
                <button
                  onClick={() => {
                    pushHistory();
                    setImages(prev => prev.filter(i => i.id !== img.id));
                  }}
                  className="p-1 bg-rose-600 text-white rounded-md shadow hover:bg-rose-500 transition cursor-pointer"
                  title="Delete image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <img src={img.url} alt={img.name || 'Board item'} className="w-full h-auto object-cover rounded-lg pointer-events-none" />
            </div>
          ))}

          {/* INLINE TEXT INSERTION POPUP */}
          {activeTextInput && (
            <div 
              style={{ left: `${activeTextInput.x}px`, top: `${activeTextInput.y - 12}px` }}
              className="absolute pointer-events-auto bg-slate-900/95 border border-purple-500 p-2 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn"
            >
              <input
                autoFocus
                type="text"
                value={activeTextInput.text}
                onChange={(e) => setActiveTextInput({ ...activeTextInput, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishText();
                  if (e.key === 'Escape') setActiveTextInput(null);
                }}
                placeholder="Type text & hit Enter..."
                className="bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none w-48"
              />
              <button
                onClick={handleFinishText}
                className="p-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* FLOATING CANVAS ZOOM & PAN CONTROLS HUD */}
        <div className="absolute bottom-6 right-4 sm:bottom-8 sm:right-8 z-30 flex flex-col sm:flex-row items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-2 shadow-2xl">
          <button
            id="wb-floating-zoom-in"
            onClick={handleZoomIn}
            disabled={zoom >= 4.0}
            className="p-2 sm:p-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-purple-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-sm"
            title="Zoom In (Ctrl + Scroll Up)"
          >
            <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            id="wb-floating-zoom-reset"
            onClick={handleResetZoom}
            className="px-2 py-1.5 rounded-lg bg-slate-800/50 text-xs sm:text-sm font-mono font-bold text-purple-300 hover:bg-purple-600/30 hover:text-white transition cursor-pointer"
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          <button
            id="wb-floating-zoom-out"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-2 sm:p-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-purple-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-sm"
            title="Zoom Out (Ctrl + Scroll Down)"
          >
            <ZoomOut className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-8 h-px sm:w-px sm:h-6 bg-brand-border/80 my-1 sm:my-0 sm:mx-1" />
          
          <button
            id="wb-floating-reset-view"
            onClick={handleResetZoom}
            className="p-2 sm:p-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-sky-600 transition cursor-pointer shadow-sm flex items-center justify-center gap-1"
            title="Reset Pan & Zoom (Center View)"
          >
            <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            id="wb-floating-pan-mode"
            onClick={() => setSelectedTool(prev => prev === 'pan' ? 'pen' : 'pan')}
            className={`p-2 sm:p-1.5 rounded-xl transition cursor-pointer shadow-sm ${
              selectedTool === 'pan' ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700'
            }`}
            title="Toggle Pan Tool (or hold Spacebar)"
          >
            <Hand className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* FOOTER HELPER */}
      <footer 
        id="whiteboard-footer"
        className="px-4 py-1.5 bg-slate-950 border-t border-brand-border/60 flex items-center justify-between text-[10px] text-slate-400 shrink-0"
      >
        <div className="flex items-center gap-2">
          <span>💡 <strong>Controls:</strong> Pan (Hold <strong>Space</strong> or <strong>Hand tool</strong>) • Zoom (<strong>Ctrl + Scroll</strong> or HUD) • Undo (<strong>Ctrl+Z</strong>) • Redo (<strong>Ctrl+Y</strong>)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Zoom: <strong className="text-purple-300 font-mono">{Math.round(zoom * 100)}%</strong></span>
          <span>Template: <strong className="text-purple-300 capitalize">{activeTemplate}</strong></span>
          <span>Board ID: <strong className="font-mono text-slate-300">{boardId}</strong></span>
        </div>
      </footer>

      {/* PREDEFINED TEMPLATES MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">Select Whiteboard Template</h3>
                  <p className="text-xs text-slate-400">Choose from interactive classroom frameworks or paper backgrounds.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    activeTemplate === tmpl.id 
                      ? 'bg-purple-900/30 border-purple-500 ring-2 ring-purple-500/20' 
                      : 'bg-slate-950 border-brand-border hover:border-purple-500/50 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-brand-border">
                        {tmpl.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-brand-border/60 flex items-center justify-between text-xs text-purple-400 font-semibold">
                    <span>Apply Template</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

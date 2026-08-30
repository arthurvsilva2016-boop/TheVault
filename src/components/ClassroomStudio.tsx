import React, { useState, useEffect, useRef } from 'react';
import { 
  Presentation,
  Video, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Columns, 
  Tv, 
  Edit3, 
  Plus, 
  Download, 
  Upload, 
  Sparkles, 
  Layers, 
  Eye, 
  EyeOff, 
  FileText, 
  CheckCircle2, 
  Users, 
  Clock, 
  MessageSquare,
  Bookmark,
  Share2,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { Group, Employee, Student, ClassSession, BookCollection, SlideItem, GroupCustomSlideshow, UnitSlideshow } from '../types';
import VirtualWhiteboard from './VirtualWhiteboard';
import SlideEditorModal from './SlideEditorModal';
import { exportSlideshowToPPTX, parsePPTXFile } from '../utils/pptxHelper';

import { useLiveCall } from "../context/LiveCallContext";
interface ClassroomStudioProps {
  group: Group;
  students: Student[];
  activeEmployee: Employee;
  employees: Employee[];
  collections: BookCollection[];
  classSessions?: ClassSession[];
  onUpdateGroup: (updatedGroup: Group) => void;
  onUpdateCollection?: (updatedCollection: BookCollection) => void;
  initialUnitNumber?: number;
  initialSlideshowId?: string;
  onNavigate?: (type: any, id?: string) => void;
}

export default function ClassroomStudio({
  group,
  students,
  activeEmployee,
  employees,
  collections = [],
  classSessions = [],
  onUpdateGroup,
  onUpdateCollection,
  initialUnitNumber,
  initialSlideshowId,
  onNavigate
}: ClassroomStudioProps) {
  const { startCall } = useLiveCall();
  // Layout view modes: 'split' (Slide + Whiteboard) | 'slides_only' | 'whiteboard_only'
  const [layoutMode, setLayoutMode] = useState<'split' | 'slides_only' | 'whiteboard_only'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Deck Source: 'custom' (group custom slideshow) | 'curriculum' (Master collection)
  const [deckSource, setDeckSource] = useState<'custom' | 'curriculum'>('custom');
  
  // Custom Slideshows of this group
  const customSlideshows: GroupCustomSlideshow[] = group.customSlideshows || [];
  
  // Selected Deck ID
  const [selectedCustomId, setSelectedCustomId] = useState<string>(
    initialSlideshowId || customSlideshows[0]?.id || ''
  );

  // Selected Curriculum Collection & Unit
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>(collections[0]?.volumes[0]?.id || '');
  const [selectedCurriculumUnit, setSelectedCurriculumUnit] = useState<number>(initialUnitNumber || 1);

  // Current Slide Navigation Index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isLaserPointerActive, setIsLaserPointerActive] = useState(false);

  // Slide Editor Modal State
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [slideEditIndex, setSlideEditIndex] = useState<number | null>(null);

  // PPTX Import
  const pptxInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingPPTX, setIsImportingPPTX] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Resolve current active collection & volume
  const currentCollection = collections.find(c => c.id === selectedCollectionId) || collections[0];
  const currentVolume = currentCollection?.volumes.find(v => v.id === selectedVolumeId) || currentCollection?.volumes[0];

  // Resolve current slides based on source
  let activeTitle = `Group ${group.code} Classroom`;
  let activeTheme = 'Interactive Class Slides';
  let activeSlides: SlideItem[] = [];
  let activeEmbedUrl = '';

  const currentCustomDeck = customSlideshows.find(s => s.id === selectedCustomId);

  if (deckSource === 'custom' && currentCustomDeck) {
    activeTitle = currentCustomDeck.unitTitle;
    activeTheme = currentCustomDeck.theme || 'Custom Group Slides';
    activeSlides = currentCustomDeck.slides || [];
    activeEmbedUrl = currentCustomDeck.embedUrl || '';
  } else {
    // Curriculum Deck
    const matchingUnitSlideshow = (currentCollection?.unitSlideshows || []).find(
      u => u.volumeId === currentVolume?.id && u.unitNumber === selectedCurriculumUnit
    );
    activeTitle = matchingUnitSlideshow?.unitTitle || `${currentCollection?.name || 'Curriculum'} • Unit ${selectedCurriculumUnit}`;
    activeTheme = matchingUnitSlideshow?.theme || currentCollection?.category || 'Curriculum Slides';
    activeSlides = matchingUnitSlideshow?.slides || [];
    activeEmbedUrl = matchingUnitSlideshow?.embedUrl || '';
  }

  // Safe slide index clamp
  const safeIndex = Math.min(Math.max(0, currentSlideIndex), Math.max(0, activeSlides.length - 1));
  const currentSlide: SlideItem | undefined = activeSlides[safeIndex];

  // Keyboard navigation for presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation if typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Space') {
        if (safeIndex < activeSlides.length - 1) {
          setCurrentSlideIndex(prev => prev + 1);
          setShowAnswerKey(false);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (safeIndex > 0) {
          setCurrentSlideIndex(prev => prev - 1);
          setShowAnswerKey(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, activeSlides.length]);

  // -------------------------------------------------------------
  // SLIDE MANAGEMENT: ADD / EDIT / SAVE / EMBED
  // -------------------------------------------------------------
  const handleSetEmbedUrl = () => {
    const currentUrl = (deckSource === 'custom' ? currentCustomDeck?.embedUrl : 
      currentCollection?.unitSlideshows?.find(u => u.volumeId === currentVolume?.id && u.unitNumber === selectedCurriculumUnit)?.embedUrl) || '';
      
    const url = window.prompt('Enter Google Slides or Presentation Embed URL (or leave blank to remove):', currentUrl);
    if (url === null) return;
    
    if (deckSource === 'custom' && currentCustomDeck) {
      const updatedDeck: GroupCustomSlideshow = {
        ...currentCustomDeck,
        embedUrl: url.trim() || undefined,
        updatedAt: new Date().toISOString()
      };
      const updatedList = customSlideshows.map(d => d.id === updatedDeck.id ? updatedDeck : d);
      onUpdateGroup({
        ...group,
        customSlideshows: updatedList
      });
      showToast(url.trim() ? 'External presentation embedded successfully!' : 'Embed removed.');
    } else if (currentCollection) {
      const unitNumber = selectedCurriculumUnit;
      const existingUnit = (currentCollection.unitSlideshows || []).find(
        u => u.volumeId === currentVolume?.id && u.unitNumber === unitNumber
      );
      
      const updatedUnit: UnitSlideshow = existingUnit ? {
        ...existingUnit,
        embedUrl: url.trim() || undefined,
        lastUpdated: new Date().toISOString()
      } : {
        id: `unit-ss-${Date.now()}`,
        collectionId: currentCollection.id,
        volumeId: currentVolume?.id,
        unitNumber,
        unitTitle: `${currentCollection.name} - Unit ${unitNumber}`,
        slides: [],
        embedUrl: url.trim() || undefined,
        lastUpdated: new Date().toISOString()
      };

      const updatedSlideshows = existingUnit
        ? (currentCollection.unitSlideshows || []).map(u => u.id === existingUnit.id ? updatedUnit : u)
        : [...(currentCollection.unitSlideshows || []), updatedUnit];

      if (onUpdateCollection) {
        onUpdateCollection({
          ...currentCollection,
          unitSlideshows: updatedSlideshows
        });
      }
      showToast(url.trim() ? 'External presentation embedded successfully!' : 'Embed removed.');
    }
  };

  const handleOpenSlideEditor = (index: number | null) => {
    setSlideEditIndex(index);
    setIsEditingSlide(true);
  };

  const handleSaveSlide = (savedSlide: SlideItem) => {
    let updatedSlides = [...activeSlides];
    if (slideEditIndex !== null && slideEditIndex >= 0 && slideEditIndex < updatedSlides.length) {
      updatedSlides[slideEditIndex] = savedSlide;
    } else {
      updatedSlides.push(savedSlide);
      setCurrentSlideIndex(updatedSlides.length - 1);
    }

    if (deckSource === 'custom' && currentCustomDeck) {
      const updatedDeck: GroupCustomSlideshow = {
        ...currentCustomDeck,
        slides: updatedSlides,
        updatedAt: new Date().toISOString()
      };
      const updatedList = customSlideshows.map(d => d.id === updatedDeck.id ? updatedDeck : d);
      onUpdateGroup({
        ...group,
        customSlideshows: updatedList
      });
      showToast('Custom slide updated successfully!');
    } else if (currentCollection) {
      const unitNumber = selectedCurriculumUnit;
      const existingUnit = (currentCollection.unitSlideshows || []).find(
        u => u.volumeId === currentVolume?.id && u.unitNumber === unitNumber
      );

      const updatedUnit: UnitSlideshow = existingUnit ? {
        ...existingUnit,
        slides: updatedSlides,
        lastUpdated: new Date().toISOString()
      } : {
        id: `ss-${currentCollection.id}-${currentVolume?.id || 'v1'}-u${unitNumber}`,
        collectionId: currentCollection.id,
        volumeId: currentVolume?.id,
        unitNumber,
        unitTitle: `Unit ${unitNumber}`,
        slides: updatedSlides,
        lastUpdated: new Date().toISOString()
      };

      const updatedSlideshows = (currentCollection.unitSlideshows || []).filter(
        u => !(u.volumeId === currentVolume?.id && u.unitNumber === unitNumber)
      );
      updatedSlideshows.push(updatedUnit);

      if (onUpdateCollection) {
        onUpdateCollection({
          ...currentCollection,
          unitSlideshows: updatedSlideshows
        });
      }
      showToast('Curriculum slide updated successfully!');
    }
  };

  // -------------------------------------------------------------
  // PPTX IMPORT DIRECTLY INTO CLASSROOM
  // -------------------------------------------------------------
  const handleImportPPTX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingPPTX(true);
    try {
      const { presentationTitle, slides } = await parsePPTXFile(file);
      if (slides.length === 0) {
        throw new Error('No slides found in the PowerPoint file.');
      }

      if (deckSource === 'custom' && currentCustomDeck) {
        const updatedDeck: GroupCustomSlideshow = {
          ...currentCustomDeck,
          unitTitle: presentationTitle || currentCustomDeck.unitTitle,
          slides,
          updatedAt: new Date().toISOString()
        };
        const updatedList = customSlideshows.map(d => d.id === updatedDeck.id ? updatedDeck : d);
        onUpdateGroup({
          ...group,
          customSlideshows: updatedList
        });
      } else {
        // Create new custom deck from PPTX
        const newDeck: GroupCustomSlideshow = {
          id: `custom-ss-${Date.now()}`,
          groupId: group.id,
          unitNumber: customSlideshows.length + 1,
          unitTitle: presentationTitle || `Imported Lesson: ${file.name.replace(/\.pptx$/i, '')}`,
          theme: 'Imported PowerPoint Deck',
          slides,
          editedByTeacherId: activeEmployee.id,
          editedByTeacherName: activeEmployee.name,
          updatedAt: new Date().toISOString(),
          status: 'draft'
        };
        onUpdateGroup({
          ...group,
          customSlideshows: [...customSlideshows, newDeck]
        });
        setDeckSource('custom');
        setSelectedCustomId(newDeck.id);
      }

      setCurrentSlideIndex(0);
      showToast(`Imported ${slides.length} PowerPoint slides successfully!`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to import PowerPoint file: ${err.message}`);
    } finally {
      setIsImportingPPTX(false);
      if (pptxInputRef.current) pptxInputRef.current.value = '';
    }
  };

  // Export to PowerPoint
  const handleExportPPTX = async () => {
    if (activeSlides.length === 0) {
      showToast('No slides available to export.');
      return;
    }
    await exportSlideshowToPPTX(activeSlides, {
      presentationTitle: activeTitle,
      unitTitle: activeTitle,
      groupCode: group.code,
      theme: activeTheme,
      authorName: activeEmployee.name
    });
    showToast('Exported presentation to .pptx!');
  };

  const groupStudents = students.filter(s => 
    s.group === group.code || 
    s.group === group.id || 
    s.group === group.name ||
    (group.code === '1' && (s.group === 'Group Alpha' || s.group === '1')) ||
    (group.code === '2' && (s.group === 'Group Beta' || s.group === '2'))
  );

  return (
    <div className={`flex flex-col h-full space-y-3 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-3' : ''}`}>
      {/* CLASSROOM TOP STUDIO CONTROL BAR */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shrink-0 shadow-lg">
        {/* Left: Environment Info & Deck Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase">
                  Classroom Hub
                </span>
                <span className="text-xs font-bold text-slate-100">{group.name || `Group ${group.code}`}</span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-400">{group.level}</span>
              </div>
              <h3 className="text-sm font-extrabold text-purple-200 line-clamp-1">{activeTitle}</h3>
            </div>
          </div>

          <div className="h-6 w-px bg-brand-border/80 hidden sm:block"></div>

          {/* Deck Source Switcher & Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-brand-border text-xs">
            <button
              onClick={() => setDeckSource('custom')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                deckSource === 'custom' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Group Custom ({customSlideshows.length})
            </button>
            <button
              onClick={() => setDeckSource('curriculum')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                deckSource === 'curriculum' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curriculum Collections
            </button>
          </div>

          {/* Deck Select Dropdowns */}
          {deckSource === 'custom' ? (
            customSlideshows.length > 0 ? (
              <select
                value={selectedCustomId}
                onChange={e => {
                  setSelectedCustomId(e.target.value);
                  setCurrentSlideIndex(0);
                }}
                className="bg-slate-950 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
              >
                {customSlideshows.map(ss => (
                  <option key={ss.id} value={ss.id}>
                    Unit {ss.unitNumber}: {ss.unitTitle} ({ss.slides.length} slides) {ss.status === 'approved' ? '✓' : '•'}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => handleOpenSlideEditor(null)}
                className="px-2.5 py-1 bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-semibold hover:bg-purple-600 hover:text-white transition cursor-pointer"
              >
                + Create Custom Slide Deck
              </button>
            )
          ) : (
            <div className="flex items-center space-x-1.5 text-xs">
              <select
                value={selectedCollectionId}
                onChange={e => {
                  setSelectedCollectionId(e.target.value);
                  const c = collections.find(col => col.id === e.target.value);
                  if (c && c.volumes.length > 0) setSelectedVolumeId(c.volumes[0].id);
                  setCurrentSlideIndex(0);
                }}
                className="bg-slate-950 border border-brand-border rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedCurriculumUnit}
                onChange={e => {
                  setSelectedCurriculumUnit(parseInt(e.target.value, 10));
                  setCurrentSlideIndex(0);
                }}
                className="bg-slate-950 border border-brand-border rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(u => (
                  <option key={u} value={u}>Unit {u}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Studio Layout Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          {/* Quick Slide Actions */}
          <button
            onClick={handleSetEmbedUrl}
            className="px-3 py-1.5 bg-slate-950 border border-blue-500/30 hover:bg-blue-600/20 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Embed Google Slides or External Link"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Embed Link</span>
          </button>
          <button
            onClick={() => pptxInputRef.current?.click()}
            disabled={isImportingPPTX}
            className="px-3 py-1.5 bg-slate-950 border border-purple-500/30 hover:bg-purple-600/20 text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Import PowerPoint Presentation (.pptx)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImportingPPTX ? 'Importing...' : 'Upload .PPTX'}</span>
          </button>
          <input
            ref={pptxInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleImportPPTX}
            className="hidden"
          />

          <button
            onClick={() => handleOpenSlideEditor(safeIndex)}
            className="px-3 py-1.5 bg-slate-950 border border-brand-border hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Edit current slide"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Edit Slide</span>
          </button>

          <button
            onClick={() => handleOpenSlideEditor(null)}
            className="px-3 py-1.5 bg-slate-950 border border-brand-border hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Add a new slide to this deck"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add Slide</span>
          </button>

          <button
            onClick={handleExportPPTX}
            disabled={activeSlides.length === 0}
            className="p-1.5 bg-slate-950 border border-brand-border hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg transition cursor-pointer"
            title="Export deck to .PPTX"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-brand-border hidden sm:block"></div>

          {/* Layout Mode Switcher */}
          <div className="flex bg-slate-950 border border-brand-border rounded-lg p-1">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'split' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split Screen: Slide Presenter + Live Whiteboard"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>

            <button
              onClick={() => setLayoutMode('slides_only')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'slides_only' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Slides Focused Full Screen"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slides Only</span>
            </button>

            <button
              onClick={() => setLayoutMode('whiteboard_only')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'whiteboard_only' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Whiteboard Focused Full Screen"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board Only</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              startCall(
                group.meetLink || `vault-room-group-${group.code}`,
                { id: activeEmployee.id, name: activeEmployee.name, role: activeEmployee.roleTitle, avatarUrl: activeEmployee.avatarUrl },
                `Group ${group.code}`,
                'class'
              );
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-600/20"
            title="Start Virtual Room"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start Class Room</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-950 border border-brand-border text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Classroom'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-lg animate-fadeIn flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* CLASSROOM MAIN WORKSPACE */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-hidden">
        {/* PANEL 1: SLIDE PRESENTER VIEWER */}
        {(layoutMode === 'split' || layoutMode === 'slides_only') && (
          <div className={`${layoutMode === 'split' ? 'lg:w-1/2' : 'w-full'} flex flex-col bg-slate-950 border border-brand-border rounded-2xl overflow-hidden shadow-2xl transition-all`}>
            {/* Slide Viewer Header Bar */}
            <div className="p-3 border-b border-brand-border bg-slate-900 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                  {activeSlides.length > 0 ? `Slide ${safeIndex + 1} / ${activeSlides.length}` : 'Empty Deck'}
                </span>
                <span className="text-xs text-slate-400 font-semibold line-clamp-1">
                  {currentSlide?.subtitle || activeTitle}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {currentSlide?.exerciseAnswer && (
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                      showAnswerKey ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAnswerKey ? 'Hide Solution' : 'Reveal Solution'}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isThumbnailsOpen ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Slide Thumbnails Drawer"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Presentation Canvas */}
            <div className={`flex-1 overflow-y-auto flex flex-col justify-between relative bg-gradient-to-b from-slate-950 to-slate-900 ${activeEmbedUrl ? '' : 'p-5 sm:p-7 space-y-6'}`}>
              {activeEmbedUrl ? (
                <iframe
                  src={activeEmbedUrl}
                  frameBorder="0"
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="w-full h-full min-h-[500px]"
                ></iframe>
              ) : activeSlides.length === 0 ? (
                <div className="m-auto text-center space-y-3 p-8 border border-dashed border-brand-border rounded-2xl bg-slate-900/50 max-w-md">
                  <Presentation className="w-12 h-12 text-purple-400 mx-auto opacity-60 animate-pulse" />
                  <h4 className="text-base font-bold text-slate-200">No Slides in this Deck</h4>
                  <p className="text-xs text-slate-400">
                    Upload a PowerPoint (.pptx) file, add an Embed URL, or click "+ Add Slide" to build your custom presentation.
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={handleSetEmbedUrl}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
                    >
                      Embed External Link
                    </button>
                    <button
                      onClick={() => pptxInputRef.current?.click()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
                    >
                      Import .PPTX
                    </button>
                    <button
                      onClick={() => handleOpenSlideEditor(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      + Add Slide
                    </button>
                  </div>
                </div>
              ) : currentSlide ? (
                <div className="space-y-5 max-w-4xl mx-auto w-full">
                  {/* Slide Title & Subtitle */}
                  <div className="border-b border-brand-border/80 pb-4">
                    {currentSlide.subtitle && (
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
                        {currentSlide.subtitle}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                      {currentSlide.title}
                    </h2>
                  </div>

                  {/* Attached Image */}
                  {currentSlide.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-brand-border bg-slate-950 p-2 shadow-lg max-w-lg mx-auto">
                      <img 
                        src={currentSlide.imageUrl} 
                        alt={currentSlide.imageCaption || currentSlide.title} 
                        className="w-full max-h-64 object-contain rounded-xl"
                      />
                      {currentSlide.imageCaption && (
                        <p className="text-[11px] text-slate-400 text-center mt-1.5 italic">
                          {currentSlide.imageCaption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Main Content Paragraph */}
                  {currentSlide.content && (
                    <div className="text-slate-200 text-sm sm:text-base leading-relaxed bg-brand-card/40 p-4 sm:p-5 rounded-2xl border border-brand-border/50 backdrop-blur-sm">
                      {currentSlide.content}
                    </div>
                  )}

                  {/* Target Vocabulary Chips */}
                  {currentSlide.vocabulary && currentSlide.vocabulary.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl space-y-2.5">
                      <span className="text-[11px] font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Target Vocabulary</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentSlide.vocabulary.map((vocab, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 rounded-lg bg-blue-600/30 text-blue-200 border border-blue-500/40 text-xs font-bold shadow-sm"
                          >
                            {vocab}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammar Structure Monospace Box */}
                  {currentSlide.grammarRule && (
                    <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                      <span className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
                        Grammar Structure & Form
                      </span>
                      <p className="text-xs sm:text-sm font-mono text-purple-200 whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-purple-500/20">
                        {currentSlide.grammarRule}
                      </p>
                    </div>
                  )}

                  {/* Custom Google-Slides Style Boxes */}
                  {currentSlide.boxes && currentSlide.boxes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentSlide.boxes.map((box, bIdx) => (
                        <div 
                          key={box.id || bIdx} 
                          className="p-4 rounded-2xl border space-y-1.5 shadow-md"
                          style={{
                            backgroundColor: box.backgroundColor || '#1E293B',
                            borderColor: box.borderColor || '#6366F1'
                          }}
                        >
                          {box.title && (
                            <span 
                              className="text-xs font-bold uppercase tracking-wider block"
                              style={{ color: box.textColor || '#A855F7' }}
                            >
                              {box.title}
                            </span>
                          )}
                          <p 
                            className="text-xs sm:text-sm leading-relaxed"
                            style={{ color: box.textColor || '#F8FAFC' }}
                          >
                            {box.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dialogue Practice Bubbles */}
                  {currentSlide.dialogue && currentSlide.dialogue.length > 0 && (
                    <div className="bg-slate-900 p-4 rounded-2xl border border-brand-border space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dialogue & Interaction</span>
                      </span>
                      <div className="space-y-2">
                        {currentSlide.dialogue.map((d, i) => (
                          <div key={i} className="text-xs sm:text-sm flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-brand-border/40">
                            <span className="font-bold text-purple-400 shrink-0 min-w-[70px]">{d.speaker}:</span>
                            <span className="text-slate-200">{d.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bullet Points */}
                  {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                    <ul className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-brand-border/50 text-slate-300 text-xs sm:text-sm">
                      {currentSlide.bulletPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-400 font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Speaking / Interactive Exercise Prompt & Solution */}
                  {currentSlide.exercisePrompt && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                      <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                        Interactive Speaking Task
                      </span>
                      <p className="text-sm font-semibold text-slate-200">
                        {currentSlide.exercisePrompt}
                      </p>

                      {showAnswerKey && currentSlide.exerciseAnswer && (
                        <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 animate-fadeIn">
                          <span className="font-bold block text-[10px] uppercase text-emerald-400">Solution / Answer Key:</span>
                          <p>{currentSlide.exerciseAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Notes (Only visible to teacher) */}
                  {currentSlide.notes && (
                    <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-[11px] text-purple-300">
                      <span className="font-bold block text-[10px] uppercase text-purple-400">Teacher Presenter Notes:</span>
                      <p className="italic">{currentSlide.notes}</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Slide Bottom Navigation Controls */}
              {activeSlides.length > 0 && (
                <div className="pt-4 border-t border-brand-border flex items-center justify-between shrink-0 bg-slate-950/80 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <button
                    disabled={safeIndex === 0}
                    onClick={() => {
                      setCurrentSlideIndex(prev => Math.max(0, prev - 1));
                      setShowAnswerKey(false);
                    }}
                    className="px-4 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {activeSlides.slice(0, 15).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentSlideIndex(i);
                          setShowAnswerKey(false);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                          i === safeIndex ? 'bg-purple-500 scale-125' : 'bg-slate-700 hover:bg-slate-500'
                        }`}
                        title={`Slide ${i + 1}`}
                      />
                    ))}
                    {activeSlides.length > 15 && (
                      <span className="text-[10px] text-slate-500">+{activeSlides.length - 15}</span>
                    )}
                  </div>

                  <button
                    disabled={safeIndex >= activeSlides.length - 1}
                    onClick={() => {
                      setCurrentSlideIndex(prev => Math.min(activeSlides.length - 1, prev + 1));
                      setShowAnswerKey(false);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Slide Thumbnails Drawer */}
            {isThumbnailsOpen && activeSlides.length > 0 && (
              <div className="p-3 bg-slate-950 border-t border-brand-border overflow-x-auto flex gap-2.5 no-scrollbar shrink-0">
                {activeSlides.map((sl, i) => (
                  <button
                    key={sl.id || i}
                    onClick={() => {
                      setCurrentSlideIndex(i);
                      setShowAnswerKey(false);
                    }}
                    className={`shrink-0 w-32 h-20 rounded-xl p-2 text-left flex flex-col justify-between border transition cursor-pointer ${
                      i === safeIndex 
                        ? 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/30' 
                        : 'border-brand-border bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-purple-400">#{i + 1}</span>
                      <span className="text-slate-500 truncate max-w-[70px]">{sl.subtitle || 'Slide'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 line-clamp-2">{sl.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: LIVE VIRTUAL WHITEBOARD */}
        {(layoutMode === 'split' || layoutMode === 'whiteboard_only') && (
          <div className={`${layoutMode === 'split' ? 'lg:w-1/2' : 'w-full'} flex flex-col bg-slate-900 border border-brand-border rounded-2xl overflow-hidden shadow-2xl p-2`}>
            <VirtualWhiteboard
              boardId={`classroom_wb_${group.id}_${deckSource === 'custom' ? selectedCustomId : `u${selectedCurriculumUnit}`}`}
              title={`Class Whiteboard • Group ${group.code} • ${activeTitle}`}
              authorName={activeEmployee.name}
              heightClass="h-full min-h-[550px]"
              showTeacherControls={true}
            />
          </div>
        )}
      </div>

      {/* SLIDE EDITOR MODAL */}
      {isEditingSlide && (
        <SlideEditorModal
          isOpen={isEditingSlide}
          slide={
            slideEditIndex !== null && activeSlides[slideEditIndex]
              ? activeSlides[slideEditIndex]
              : {
                  id: `slide-${Date.now()}`,
                  title: `Slide ${activeSlides.length + 1}`,
                  subtitle: activeTitle,
                  content: '',
                  vocabulary: [],
                  grammarRule: '',
                  dialogue: [],
                  bulletPoints: [],
                  boxes: []
                }
          }
          slideIndex={slideEditIndex}
          totalSlidesCount={activeSlides.length}
          onSave={handleSaveSlide}
          onClose={() => setIsEditingSlide(false)}
        />
      )}
    </div>
  );
}

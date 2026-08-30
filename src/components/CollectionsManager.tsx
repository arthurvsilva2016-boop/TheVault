import React, { useState, useRef } from 'react';
import SaveButton from './SaveButton';
import { BookCollection, BookVolume, Employee, Group, Student, UnitSlideshow, SlideItem } from '../types';
import { 
  BookOpen, 
  Plus, 
  Layers, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  CheckCircle2, 
  FolderPlus, 
  Library, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  BookMarked,
  Presentation,
  Upload,
  Eye,
  Maximize2,
  Minimize2,
  Lock,
  ShieldCheck,
  MoveUp,
  MoveDown,
  Info,
  CalendarDays,
  Paintbrush,
  MessageSquare,
  Send,
  RotateCcw
} from 'lucide-react';
import { canManageCollections } from '../utils/roles';
import { exportSlideshowToPPTX, parsePPTXFile } from '../utils/pptxHelper';
import SlideEditorModal from './SlideEditorModal';
import VirtualWhiteboard from './VirtualWhiteboard';

interface CollectionsManagerProps {
  collections: BookCollection[];
  groups: Group[];
  students: Student[];
  activeEmployee: Employee;
  onAddCollection: (collection: BookCollection) => void;
  onUpdateCollection: (collection: BookCollection) => void;
  onDeleteCollection: (id: string) => void;
  onUpdateGroup?: (group: Group) => void;
  onNavigate?: (type: any, id?: string) => void;
}

// Generate default unit slideshows for a collection volume without example/placeholder slides
export const generateDefaultSlideshowsForVolume = (collectionId: string, volumeId: string, volumeName: string, unitsCount: number = 12): UnitSlideshow[] => {
  const slideshows: UnitSlideshow[] = [];
  for (let i = 1; i <= unitsCount; i++) {
    slideshows.push({
      id: `ss-${collectionId}-${volumeId}-u${i}`,
      collectionId,
      volumeId,
      unitNumber: i,
      unitTitle: `Unit ${i}`,
      theme: undefined,
      slides: []
    });
  }
  return slideshows;
};

export default function CollectionsManager({
  collections,
  groups,
  students,
  activeEmployee,
  onAddCollection,
  onUpdateCollection,
  onDeleteCollection,
  onUpdateGroup,
  onNavigate
}: CollectionsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(collections[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<'volumes' | 'slideshows'>('volumes');

  // Selected Volume & Unit for Slideshow
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number>(1);

  // Classroom Presentation Studio State (Slideshow Presenter)
  const [isPresentingClassroom, setIsPresentingClassroom] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSlideFullscreen, setIsSlideFullscreen] = useState(false);
  const [isPresenterWhiteboardOpen, setIsPresenterWhiteboardOpen] = useState(false);
  const [isPresenterChatOpen, setIsPresenterChatOpen] = useState(false);
  const [presenterMessages, setPresenterMessages] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([
    { id: '1', sender: 'Classroom Bot', text: 'Class session active. Slides and whiteboard are synchronized for the group.', time: 'Now' }
  ]);
  const [presenterChatInput, setPresenterChatInput] = useState('');

  // New Collection Modal State
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColCategory, setNewColCategory] = useState<BookCollection['category']>('General English');
  const [newColDescription, setNewColDescription] = useState('');
  const [initialVolumeName, setInitialVolumeName] = useState('Vol 1');

  // Edit Collection State
  const [editingCollection, setEditingCollection] = useState<BookCollection | null>(null);
  const [editColName, setEditColName] = useState('');
  const [editColCategory, setEditColCategory] = useState<BookCollection['category']>('General English');
  const [editColDesc, setEditColDesc] = useState('');

  // New Volume Modal / Inline State
  const [isAddingVolume, setIsAddingVolume] = useState(false);
  const [newVolName, setNewVolName] = useState('');
  const [newVolDesc, setNewVolDesc] = useState('');
  const [newVolUnits, setNewVolUnits] = useState(12);

  // Edit Volume State
  const [editingVolume, setEditingVolume] = useState<{ collectionId: string; volume: BookVolume } | null>(null);
  const [editVolName, setEditVolName] = useState('');
  const [editVolDesc, setEditVolDesc] = useState('');
  const [editVolUnits, setEditVolUnits] = useState(12);

  // Delete Confirmation
  const [deleteConfirmColId, setDeleteConfirmColId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // SLIDESHOW EDITING & UPLOAD MODAL STATES (ADMIN ONLY)
  // -------------------------------------------------------------
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [slideEditIndex, setSlideEditIndex] = useState<number | null>(null);
  const [slideFormData, setSlideFormData] = useState<SlideItem>({
    id: '',
    title: '',
    subtitle: '',
    content: '',
    vocabulary: [],
    grammarRule: '',
    dialogue: [],
    bulletPoints: [],
    exercisePrompt: '',
    exerciseAnswer: ''
  });
  const [vocabInput, setVocabInput] = useState('');
  const [bulletsInput, setBulletsInput] = useState('');
  const [dialogueInput, setDialogueInput] = useState('');

  // Upload / Import Slideshow Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadJsonText, setUploadJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Role permissions check
  const isAdminUser = canManageCollections(activeEmployee);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredCollections = collections.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || 
           (c.description && c.description.toLowerCase().includes(q)) ||
           (c.category && c.category.toLowerCase().includes(q)) ||
           c.volumes.some(v => v.name.toLowerCase().includes(q));
  });

  const selectedCollection = collections.find(c => c.id === selectedCollectionId) || collections[0];
  const activeVolume = selectedCollection?.volumes.find(v => v.id === selectedVolumeId) || selectedCollection?.volumes[0];

  // Retrieve or generate unit slideshows for selected collection
  const getUnitSlideshows = (): UnitSlideshow[] => {
    if (!selectedCollection || !activeVolume) return [];
    if (selectedCollection.unitSlideshows && selectedCollection.unitSlideshows.length > 0) {
      const volumeSlideshows = selectedCollection.unitSlideshows.filter(s => s.volumeId === activeVolume.id || !s.volumeId);
      if (volumeSlideshows.length > 0) return volumeSlideshows;
    }
    return generateDefaultSlideshowsForVolume(selectedCollection.id, activeVolume.id, activeVolume.name, activeVolume.unitsCount || 12);
  };

  const currentUnitSlideshows = getUnitSlideshows();
  const currentUnitSlideshow = currentUnitSlideshows.find(u => u.unitNumber === selectedUnitNumber) || currentUnitSlideshows[0];

  const getCollectionUsageCount = (collectionName: string) => {
    return groups.filter(g => g.level.toLowerCase().includes(collectionName.toLowerCase())).length;
  };

  // Submit Create Collection
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !isAdminUser) return;

    const volId = `vol-${Date.now()}-1`;
    const newCollection: BookCollection = {
      id: `col-${Date.now()}`,
      name: newColName.trim(),
      category: newColCategory,
      description: newColDescription.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      volumes: initialVolumeName.trim() ? [
        {
          id: volId,
          name: initialVolumeName.trim(),
          description: `Initial Volume for ${newColName.trim()}`,
          unitsCount: 12
        }
      ] : [],
      unitSlideshows: generateDefaultSlideshowsForVolume(`col-${Date.now()}`, volId, initialVolumeName.trim() || 'Vol 1', 12)
    };

    onAddCollection(newCollection);
    setSelectedCollectionId(newCollection.id);
    setIsCreatingCollection(false);
    setNewColName('');
    setNewColDescription('');
    setInitialVolumeName('Vol 1');
    showToast(`Collection "${newCollection.name}" created successfully!`);
  };

  // Submit Edit Collection
  const handleUpdateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection || !editColName.trim() || !isAdminUser) return;

    const updated: BookCollection = {
      ...editingCollection,
      name: editColName.trim(),
      category: editColCategory,
      description: editColDesc.trim() || undefined,
    };

    onUpdateCollection(updated);
    setEditingCollection(null);
    showToast(`Collection "${updated.name}" updated!`);
  };

  // Submit Add Volume
  const handleAddVolumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollection || !newVolName.trim() || !isAdminUser) return;

    const newVolId = `vol-${Date.now()}`;
    const newVolUnitsCount = newVolUnits > 0 ? newVolUnits : 12;
    const newVol: BookVolume = {
      id: newVolId,
      name: newVolName.trim(),
      description: newVolDesc.trim() || undefined,
      unitsCount: newVolUnitsCount,
    };

    const newSlides = generateDefaultSlideshowsForVolume(selectedCollection.id, newVolId, newVolName.trim(), newVolUnitsCount);

    const updated: BookCollection = {
      ...selectedCollection,
      volumes: [...selectedCollection.volumes, newVol],
      unitSlideshows: [...(selectedCollection.unitSlideshows || []), ...newSlides]
    };

    onUpdateCollection(updated);
    setIsAddingVolume(false);
    setNewVolName('');
    setNewVolDesc('');
    setNewVolUnits(12);
    showToast(`Volume "${newVol.name}" added to ${selectedCollection.name}!`);
  };

  // Delete Volume
  const handleDeleteVolume = (colId: string, volId: string, volName: string) => {
    if (!isAdminUser) return;
    if (!confirm(`Are you sure you want to delete volume "${volName}"?`)) return;

    const targetCol = collections.find(c => c.id === colId);
    if (!targetCol) return;

    const updatedCol: BookCollection = {
      ...targetCol,
      volumes: targetCol.volumes.filter(v => v.id !== volId),
      unitSlideshows: (targetCol.unitSlideshows || []).filter(s => s.volumeId !== volId)
    };

    onUpdateCollection(updatedCol);
    showToast(`Volume removed.`);
  };

  // Delete Collection
  const handleDeleteCollection = (id: string) => {
    if (!isAdminUser) return;
    onDeleteCollection(id);
    setDeleteConfirmColId(null);
    if (selectedCollectionId === id) {
      const remaining = collections.filter(c => c.id !== id);
      setSelectedCollectionId(remaining[0]?.id || null);
    }
    showToast(`Collection deleted.`);
  };

  // -------------------------------------------------------------
  // SLIDESHOW EDIT / ADD / REMOVE / REORDER (ADMIN ONLY)
  // -------------------------------------------------------------
  const openNewSlideModal = () => {
    if (!isAdminUser) return;
    setSlideEditIndex(null);
    setIsEditingSlide(true);
  };

  const openEditSlideModal = (_slide: SlideItem, index: number) => {
    if (!isAdminUser) return;
    setSlideEditIndex(index);
    setIsEditingSlide(true);
  };

  const handleSaveSlideFromModal = (completeSlide: SlideItem) => {
    if (!selectedCollection || !currentUnitSlideshow || !isAdminUser) return;

    let updatedSlides = [...currentUnitSlideshow.slides];
    if (slideEditIndex !== null && slideEditIndex >= 0 && slideEditIndex < updatedSlides.length) {
      updatedSlides[slideEditIndex] = completeSlide;
    } else {
      updatedSlides.push(completeSlide);
    }

    const updatedUnitSlideshow: UnitSlideshow = {
      ...currentUnitSlideshow,
      slides: updatedSlides,
      lastUpdated: new Date().toISOString()
    };

    // Update in collection
    const updatedCollection: BookCollection = {
      ...selectedCollection,
      unitSlideshows: currentUnitSlideshows.map(u => u.id === currentUnitSlideshow.id ? updatedUnitSlideshow : u)
    };

    onUpdateCollection(updatedCollection);
    setIsEditingSlide(false);
    showToast(slideEditIndex !== null ? 'Slide updated successfully!' : 'New slide added!');
  };

  const handleDeleteSlide = (index: number) => {
    if (!isAdminUser || !selectedCollection || !currentUnitSlideshow) return;
    if (!confirm(`Are you sure you want to remove slide ${index + 1}?`)) return;

    const updatedSlides = currentUnitSlideshow.slides.filter((_, idx) => idx !== index);
    const updatedUnitSlideshow: UnitSlideshow = {
      ...currentUnitSlideshow,
      slides: updatedSlides,
      lastUpdated: new Date().toISOString()
    };

    const updatedCollection: BookCollection = {
      ...selectedCollection,
      unitSlideshows: currentUnitSlideshows.map(u => u.id === currentUnitSlideshow.id ? updatedUnitSlideshow : u)
    };

    onUpdateCollection(updatedCollection);
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(Math.max(0, updatedSlides.length - 1));
    }
    showToast('Slide removed.');
  };

  const handleClearUnitSlides = (unitId: string) => {
    if (!isAdminUser || !selectedCollection) return;
    const targetUnit = selectedCollection.unitSlideshows?.find(u => u.id === unitId);
    if (!targetUnit) return;
    
    const updatedUnitSlideshow: UnitSlideshow = {
      ...targetUnit,
      slides: [],
      lastUpdated: new Date().toISOString()
    };

    const updatedCollection: BookCollection = {
      ...selectedCollection,
      unitSlideshows: (selectedCollection.unitSlideshows || []).map(u => 
        u.id === unitId ? updatedUnitSlideshow : u
      )
    };

    onUpdateCollection(updatedCollection);
    showToast(`Slides cleared for Unit ${targetUnit.unitNumber}.`);
  };

  const handleClearAllSlides = () => {
    if (!isAdminUser || !selectedCollection || !currentUnitSlideshow) return;
    if (currentUnitSlideshow.slides.length === 0) return;
    if (!confirm(`Are you sure you want to permanently remove all ${currentUnitSlideshow.slides.length} slides from Unit ${currentUnitSlideshow.unitNumber}?`)) return;

    const updatedUnitSlideshow: UnitSlideshow = {
      ...currentUnitSlideshow,
      slides: [],
      lastUpdated: new Date().toISOString()
    };

    const updatedCollection: BookCollection = {
      ...selectedCollection,
      unitSlideshows: currentUnitSlideshows.map(u => u.id === currentUnitSlideshow.id ? updatedUnitSlideshow : u)
    };

    onUpdateCollection(updatedCollection);
    setCurrentSlideIndex(0);
    showToast(`All slides removed from Unit ${currentUnitSlideshow.unitNumber}.`);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (!isAdminUser || !selectedCollection || !currentUnitSlideshow) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentUnitSlideshow.slides.length) return;

    const newSlides = [...currentUnitSlideshow.slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);

    const updatedUnitSlideshow: UnitSlideshow = {
      ...currentUnitSlideshow,
      slides: newSlides,
      lastUpdated: new Date().toISOString()
    };

    const updatedCollection: BookCollection = {
      ...selectedCollection,
      unitSlideshows: currentUnitSlideshows.map(u => u.id === currentUnitSlideshow.id ? updatedUnitSlideshow : u)
    };

    onUpdateCollection(updatedCollection);
    setCurrentSlideIndex(targetIndex);
    showToast(`Slide moved ${direction}.`);
  };

  // -------------------------------------------------------------
  // POWERPOINT & JSON UPLOAD / IMPORT SLIDESHOW (ADMIN ONLY)
  // -------------------------------------------------------------
  const [isProcessingPPTX, setIsProcessingPPTX] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pptx') || file.type.includes('presentation')) {
      if (!isAdminUser || !selectedCollection || !currentUnitSlideshow) return;
      setIsProcessingPPTX(true);
      try {
        const { slides, presentationTitle } = await parsePPTXFile(file);
        if (slides.length === 0) {
          throw new Error('No slides found in the PowerPoint file.');
        }

        const updatedUnitSlideshow: UnitSlideshow = {
          ...currentUnitSlideshow,
          slides,
          unitTitle: currentUnitSlideshow.unitTitle || presentationTitle || `Unit ${currentUnitSlideshow.unitNumber}`,
          lastUpdated: new Date().toISOString()
        };

        const updatedCollection: BookCollection = {
          ...selectedCollection,
          unitSlideshows: currentUnitSlideshows.map(u => u.id === currentUnitSlideshow.id ? updatedUnitSlideshow : u)
        };

        onUpdateCollection(updatedCollection);
        setIsUploadModalOpen(false);
        setUploadJsonText('');
        setCurrentSlideIndex(0);
        showToast(`Successfully imported ${slides.length} slides from PowerPoint (${file.name})!`);
      } catch (err: any) {
        console.error('PPTX Import error:', err);
        showToast(`Failed to import PowerPoint file: ${err.message}`);
      } finally {
        setIsProcessingPPTX(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setUploadJsonText(text);
      } catch (err) {
        showToast('Could not read JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyUploadSlideshow = () => {
    if (!isAdminUser || !selectedCollection || !currentUnitSlideshow) return;
    if (!uploadJsonText.trim()) return;

    try {
      const parsed = JSON.parse(uploadJsonText);
      let slidesToImport: SlideItem[] = [];

      if (Array.isArray(parsed)) {
        slidesToImport = parsed;
      } else if (parsed.slides && Array.isArray(parsed.slides)) {
        slidesToImport = parsed.slides;
      } else {
        throw new Error('JSON must be an array of slide objects or an object with a "slides" array.');
      }

      if (slidesToImport.length === 0) {
        throw new Error('No slides found in the imported JSON.');
      }

      // Validate basic structure
      slidesToImport = slidesToImport.map((sl, idx) => ({
        id: sl.id || `sl-imported-${Date.now()}-${idx}`,
        title: sl.title || `Slide ${idx + 1}`,
        subtitle: sl.subtitle || undefined,
        content: sl.content || undefined,
        vocabulary: Array.isArray(sl.vocabulary) ? sl.vocabulary : undefined,
        grammarRule: sl.grammarRule || undefined,
        dialogue: Array.isArray(sl.dialogue) ? sl.dialogue : undefined,
        bulletPoints: Array.isArray(sl.bulletPoints) ? sl.bulletPoints : undefined,
        exercisePrompt: sl.exercisePrompt || undefined,
        exerciseAnswer: sl.exerciseAnswer || undefined,
      }));

      const updatedUnitSlideshow: UnitSlideshow = {
        ...currentUnitSlideshow,
        slides: slidesToImport,
        unitTitle: parsed.unitTitle || currentUnitSlideshow.unitTitle,
        theme: parsed.theme || currentUnitSlideshow.theme,
        lastUpdated: new Date().toISOString()
      };

      const updatedCollection: BookCollection = {
        ...selectedCollection,
        unitSlideshows: currentUnitSlideshows.map(u => u.id === currentUnitSlideshow.id ? updatedUnitSlideshow : u)
      };

      onUpdateCollection(updatedCollection);
      setIsUploadModalOpen(false);
      setUploadJsonText('');
      setCurrentSlideIndex(0);
      showToast(`Successfully uploaded ${slidesToImport.length} slides for Unit ${currentUnitSlideshow.unitNumber}!`);
    } catch (err: any) {
      showToast(`Invalid JSON format: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // DOWNLOAD SLIDESHOW AS POWERPOINT (.PPTX) (AVAILABLE TO ALL)
  // -------------------------------------------------------------
  const handleDownloadSlideshowPPTX = async () => {
    if (!currentUnitSlideshow) return;
    if (currentUnitSlideshow.slides.length === 0) {
      showToast('This unit has no slides to export yet.');
      return;
    }
    try {
      await exportSlideshowToPPTX(currentUnitSlideshow.slides, {
        presentationTitle: `${selectedCollection?.name || 'Curriculum'} - ${currentUnitSlideshow.unitTitle}`,
        unitNumber: currentUnitSlideshow.unitNumber,
        unitTitle: currentUnitSlideshow.unitTitle,
        theme: currentUnitSlideshow.theme,
        authorName: activeEmployee.name
      });
      showToast('PowerPoint (.pptx) presentation downloaded!');
    } catch (err: any) {
      console.error('PPTX export error:', err);
      showToast('Failed to export PowerPoint presentation.');
    }
  };

  return (
    <section className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-400 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CLASSROOM SLIDESHOW PRESENTER (CLEAN STAGE PRESENTER WITH WHITEBOARD & CHAT INTEGRATION) */}
      {isPresentingClassroom && currentUnitSlideshow && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fadeIn select-none">
          {/* Top Stage Navigation Bar */}
          <header className="px-6 py-3 bg-slate-900 border-b border-brand-border flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Presentation className="w-3.5 h-3.5" />
                Curriculum Slideshow Studio
              </span>
              <h3 className="text-sm font-bold text-slate-100 hidden sm:inline">
                {selectedCollection?.name} • {currentUnitSlideshow.unitTitle}
              </h3>
            </div>

            <div className="flex items-center space-x-2.5">
              {/* Whiteboard Launcher Button */}
              <button
                onClick={() => setIsPresenterWhiteboardOpen(!isPresenterWhiteboardOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                  isPresenterWhiteboardOpen
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-500/30'
                }`}
                title="Launch Interactive Whiteboard"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>{isPresenterWhiteboardOpen ? 'Hide Whiteboard' : 'Whiteboard'}</span>
              </button>

              {/* Chat Launcher Button */}
              <button
                onClick={() => setIsPresenterChatOpen(!isPresenterChatOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                  isPresenterChatOpen
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/30'
                }`}
                title="Toggle Classroom Chat / Notes"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isPresenterChatOpen ? 'Hide Chat' : 'Chat'}</span>
              </button>

              {/* Download PPTX Button */}
              <button
                onClick={handleDownloadSlideshowPPTX}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Download PowerPoint Presentation (.pptx)"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Download .PPTX</span>
              </button>

              <button
                onClick={() => setIsSlideFullscreen(!isSlideFullscreen)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isSlideFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setIsPresentingClassroom(false);
                  setIsPresenterWhiteboardOpen(false);
                  setIsPresenterChatOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600 hover:text-white text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Exit Presenter</span>
              </button>
            </div>
          </header>

          {/* Main Presenter Stage Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Slide Stage Container */}
            <div className={`flex-1 flex flex-col justify-between p-6 transition-all overflow-y-auto ${
              isPresenterWhiteboardOpen && !isPresenterChatOpen ? 'w-1/2' : ''
            }`}>
              {currentUnitSlideshow.embedUrl ? (
                <iframe
                  src={currentUnitSlideshow.embedUrl}
                  frameBorder="0"
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="w-full h-full min-h-[500px]"
                ></iframe>
              ) : currentUnitSlideshow.slides[currentSlideIndex] && (
                <div 
                  className="rounded-3xl border border-purple-500/30 p-8 shadow-2xl space-y-6 animate-fadeIn my-auto max-w-4xl mx-auto w-full transition-colors"
                  style={{
                    backgroundColor: currentUnitSlideshow.slides[currentSlideIndex].backgroundColor || 'rgb(15 23 42)',
                    borderColor: currentUnitSlideshow.slides[currentSlideIndex].themeColor || 'rgba(168, 85, 247, 0.3)'
                  }}
                >
                  <div className="flex items-center justify-between border-b border-brand-border/80 pb-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-purple-400">
                        Slide {currentSlideIndex + 1} of {currentUnitSlideshow.slides.length}
                      </span>
                      <h2 className="text-2xl font-bold text-slate-100 mt-1">
                        {currentUnitSlideshow.slides[currentSlideIndex].title}
                      </h2>
                    </div>
                    {currentUnitSlideshow.slides[currentSlideIndex].subtitle && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {currentUnitSlideshow.slides[currentSlideIndex].subtitle}
                      </span>
                    )}
                  </div>

                  {/* Slide Image if present */}
                  {currentUnitSlideshow.slides[currentSlideIndex].imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-brand-border max-h-64 flex items-center justify-center bg-slate-950/60">
                      <img 
                        src={currentUnitSlideshow.slides[currentSlideIndex].imageUrl} 
                        alt="Slide Media" 
                        referrerPolicy="no-referrer"
                        className="max-h-64 object-contain" 
                      />
                    </div>
                  )}

                  {/* Slide Text Content */}
                  {currentUnitSlideshow.slides[currentSlideIndex].content && (
                    <p className="text-base text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                      {currentUnitSlideshow.slides[currentSlideIndex].content}
                    </p>
                  )}

                  {/* Custom Callout Boxes if present */}
                  {currentUnitSlideshow.slides[currentSlideIndex].boxes && currentUnitSlideshow.slides[currentSlideIndex].boxes!.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentUnitSlideshow.slides[currentSlideIndex].boxes!.map((b, idx) => (
                        <div 
                          key={b.id || idx}
                          className="p-4 rounded-2xl border text-sm space-y-1 shadow-sm"
                          style={{
                            backgroundColor: b.backgroundColor || 'rgba(30, 41, 59, 0.8)',
                            borderColor: b.borderColor || 'rgba(168, 85, 247, 0.4)',
                            color: b.textColor || '#f8fafc'
                          }}
                        >
                          <span className="text-xs font-bold uppercase tracking-wider block opacity-80">{b.title}</span>
                          <p className="leading-relaxed font-medium">{b.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vocabulary Chips */}
                  {currentUnitSlideshow.slides[currentSlideIndex].vocabulary && currentUnitSlideshow.slides[currentSlideIndex].vocabulary!.length > 0 && (
                    <div className="p-4 bg-slate-900/90 rounded-2xl border border-purple-500/30 space-y-2">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                        📖 Unit Target Vocabulary
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentUnitSlideshow.slides[currentSlideIndex].vocabulary!.map((v, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-200 border border-purple-500/30 text-sm font-semibold">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammar Rule Highlight */}
                  {currentUnitSlideshow.slides[currentSlideIndex].grammarRule && (
                    <div className="p-4 bg-indigo-950/50 rounded-2xl border border-indigo-500/40 space-y-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                        ⚖️ Grammar Target Structure & Rules
                      </span>
                      <pre className="text-sm text-indigo-100 whitespace-pre-wrap font-sans leading-relaxed">
                        {currentUnitSlideshow.slides[currentSlideIndex].grammarRule}
                      </pre>
                    </div>
                  )}

                  {/* Bullet Points */}
                  {currentUnitSlideshow.slides[currentSlideIndex].bulletPoints && currentUnitSlideshow.slides[currentSlideIndex].bulletPoints!.length > 0 && (
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      {currentUnitSlideshow.slides[currentSlideIndex].bulletPoints!.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-purple-400 font-bold text-lg leading-none">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Dialogue Model */}
                  {currentUnitSlideshow.slides[currentSlideIndex].dialogue && currentUnitSlideshow.slides[currentSlideIndex].dialogue!.length > 0 && (
                    <div className="p-4 bg-slate-900/90 rounded-2xl border border-brand-border space-y-2.5">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                        💬 Interactive Dialogue Model
                      </span>
                      <div className="space-y-2">
                        {currentUnitSlideshow.slides[currentSlideIndex].dialogue!.map((d, i) => (
                          <div key={i} className="text-sm">
                            <strong className="text-purple-300">{d.speaker}:</strong>{' '}
                            <span className="text-slate-200">{d.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Exercise Prompt */}
                  {currentUnitSlideshow.slides[currentSlideIndex].exercisePrompt && (
                    <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/40 text-sm text-emerald-200 space-y-1">
                      <strong className="block text-emerald-300 font-bold">🎯 Classroom Speaking / Writing Task:</strong>
                      <p>{currentUnitSlideshow.slides[currentSlideIndex].exercisePrompt}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between mt-6 bg-slate-900/90 p-4 rounded-2xl border border-brand-border shrink-0 max-w-4xl mx-auto w-full">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Slide Dots */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-md px-2">
                  {currentUnitSlideshow.slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        currentSlideIndex === idx ? 'w-8 bg-purple-500' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  disabled={currentSlideIndex >= currentUnitSlideshow.slides.length - 1}
                  onClick={() => setCurrentSlideIndex(prev => Math.min(currentUnitSlideshow.slides.length - 1, prev + 1))}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Screen Integrated Whiteboard Panel */}
            {isPresenterWhiteboardOpen && (
              <div className="w-1/2 border-l border-brand-border flex flex-col bg-slate-900 animate-slideLeft z-10">
                <div className="p-3 bg-slate-800 border-b border-brand-border flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Paintbrush className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-100">Live Stage Whiteboard</span>
                  </div>
                  <button 
                    onClick={() => setIsPresenterWhiteboardOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <VirtualWhiteboard />
                </div>
              </div>
            )}

            {/* Slide-out Classroom Chat Drawer */}
            {isPresenterChatOpen && (
              <div className="w-80 border-l border-brand-border flex flex-col bg-slate-900 animate-slideLeft z-20 shrink-0">
                <div className="p-3.5 bg-slate-800 border-b border-brand-border flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-100">Classroom Live Chat</span>
                  </div>
                  <button 
                    onClick={() => setIsPresenterChatOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                  {presenterMessages.map(msg => (
                    <div key={msg.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-brand-border space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <strong className="text-purple-300">{msg.sender}</strong>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-slate-200">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!presenterChatInput.trim()) return;
                    setPresenterMessages(prev => [
                      ...prev,
                      {
                        id: String(Date.now()),
                        sender: activeEmployee.name,
                        text: presenterChatInput.trim(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                    setPresenterChatInput('');
                  }}
                  className="p-3 border-t border-brand-border bg-slate-900 flex gap-2"
                >
                  <input
                    type="text"
                    value={presenterChatInput}
                    onChange={(e) => setPresenterChatInput(e.target.value)}
                    placeholder="Type message to students..."
                    className="flex-1 bg-slate-800 border border-brand-border rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER WITH ROLE BADGE */}
      <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isAdminUser 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            }`}>
              {isAdminUser ? 'Administrator Curriculum Master Storage' : 'Teacher Curriculum Access (Read-Only)'}
            </span>
            <span className="text-xs text-slate-400">{collections.length} Book Collections Registered</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5 flex items-center">
            <Library className="w-5 h-5 mr-2 text-purple-400" />
            Curriculum Collections & Unit Slideshows
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isAdminUser 
              ? 'Manage official book collections, volumes, and unit slideshows. Administrators can edit, upload, modify, and publish master curriculum slides.'
              : 'View and download official curriculum slideshows. To customize lesson slides for your specific classes, navigate to your Group Profile Schedule to create a group edition.'}
          </p>
        </div>

        {isAdminUser && (
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => setIsCreatingCollection(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition flex items-center cursor-pointer shadow-sm"
            >
              <FolderPlus className="w-4 h-4 mr-1.5" />
              + New Collection
            </button>
          </div>
        )}
      </div>

      {/* NOTICE BANNER FOR TEACHERS */}
      {!isAdminUser && (
        <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-start gap-3 text-xs text-blue-200">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-100">Master Curriculum Standards</p>
            <p className="text-blue-300/90 leading-relaxed">
              These slideshows represent the official school curriculum. As a teacher, you can view and download any unit slideshow here. To customize slides specifically for your group classes, open your assigned <strong className="text-white">Group Profile &gt; Schedule</strong> where you can tailor slides with administrator approval.
            </p>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: COLLECTIONS SIDEBAR + SELECTED COLLECTION HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Collections Catalog */}
        <div className="space-y-4">
          <div className="bg-brand-card p-4 rounded-xl border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <BookMarked className="w-4 h-4 mr-1.5 text-purple-400" />
                Book Series Catalog
              </h3>
              <span className="text-[11px] text-slate-400">{filteredCollections.length} Series</span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search collection or volume..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Collections List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 no-scrollbar">
              {filteredCollections.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No collections matching your search.
                </div>
              ) : (
                filteredCollections.map(col => {
                  const isSelected = selectedCollection?.id === col.id;
                  const usageCount = getCollectionUsageCount(col.name);

                  return (
                    <div
                      key={col.id}
                      onClick={() => {
                        setSelectedCollectionId(col.id);
                        setSelectedVolumeId(col.volumes[0]?.id || null);
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col space-y-1.5 ${
                        isSelected
                          ? 'bg-purple-900/30 border-purple-500 shadow-sm'
                          : 'bg-brand-dark/70 border-brand-border hover:border-purple-500/50 hover:bg-brand-dark'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-purple-200' : 'text-slate-200'}`}>
                          {col.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-brand-dark text-purple-300 border border-purple-500/20">
                          {col.volumes.length} Vols
                        </span>
                      </div>

                      {col.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {col.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-brand-border/60 text-[10px] text-slate-400">
                        <span className="text-purple-400/90 font-medium">{col.category || 'General English'}</span>
                        <span className="font-semibold text-slate-300">{usageCount} Active Groups</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Collection Hub with Sub-Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCollection ? (
            <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden shadow-sm">
              
              {/* Collection Header Bar */}
              <div className="p-5 bg-brand-dark/80 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 uppercase">
                      {selectedCollection.category || 'Curriculum Collection'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Created: {selectedCollection.createdAt || '2026'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
                    Collection: {selectedCollection.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                    {selectedCollection.description || 'No detailed description provided for this collection.'}
                  </p>
                </div>

                {/* Sub-Tabs Selector */}
                <div className="flex items-center space-x-1.5 bg-brand-card p-1 rounded-xl border border-brand-border self-start sm:self-auto">
                  <button
                    onClick={() => setActiveSubTab('volumes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      activeSubTab === 'volumes' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Volumes</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('slideshows')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      activeSubTab === 'slideshows' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    <span>Unit Slideshows</span>
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: VOLUMES */}
              {activeSubTab === 'volumes' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 flex items-center">
                        <Layers className="w-4 h-4 mr-1.5 text-purple-400" />
                        Registered Volumes for {selectedCollection.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Each volume contains unit slideshows and classroom presentation curriculum.
                      </p>
                    </div>

                    {isAdminUser && (
                      <button
                        onClick={() => setIsAddingVolume(true)}
                        className="px-3.5 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-semibold rounded-lg transition flex items-center cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Volume
                      </button>
                    )}
                  </div>

                  {/* Inline Add Volume Form (Admin only) */}
                  {isAddingVolume && isAdminUser && (
                    <form onSubmit={handleAddVolumeSubmit} className="p-4 bg-brand-dark rounded-xl border border-purple-500/50 space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                        <h5 className="text-xs font-bold text-purple-300">Add New Volume to {selectedCollection.name}</h5>
                        <button type="button" onClick={() => setIsAddingVolume(false)} className="text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Volume Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Vol 1, Level 2, Starter"
                            value={newVolName}
                            onChange={e => setNewVolName(e.target.value)}
                            className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Units / Chapters Count</label>
                          <input
                            type="number"
                            value={newVolUnits}
                            onChange={e => setNewVolUnits(parseInt(e.target.value) || 12)}
                            min="1"
                            max="50"
                            className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Description / Scope</label>
                          <input
                            type="text"
                            placeholder="e.g. Focus on B1 grammar & syntax"
                            value={newVolDesc}
                            onChange={e => setNewVolDesc(e.target.value)}
                            className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingVolume(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <SaveButton type="submit" isFormSubmit={true} className="px-5 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition cursor-pointer shadow-sm" label="Add Volume" savedLabel="Saved" />
                      </div>
                    </form>
                  )}

                  <div className="space-y-3 mt-4">
                    {selectedCollection.volumes.map(vol => (
                      <div key={vol.id} className="flex justify-between items-center p-3 bg-brand-dark/50 rounded-lg border border-brand-border">
                         <div>
                           <div className="font-semibold text-slate-200 text-sm flex items-center">
                             <Library className="w-4 h-4 mr-2 text-purple-400" />
                             {vol.name}
                           </div>
                           <div className="text-xs text-slate-400 mt-1">{vol.unitsCount} Units • {vol.description || 'Curriculum level'}</div>
                         </div>
                         <div className="flex space-x-2">
                           <button 
                             onClick={() => {
                               setSelectedVolumeId(vol.id);
                               setActiveSubTab('slideshows');
                             }}
                             className="px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 rounded-lg cursor-pointer transition flex items-center gap-1"
                           >
                             <Presentation className="w-3.5 h-3.5" />
                             <span>Open Slideshows</span>
                           </button>
                           {isAdminUser && (
                             <>
                               <button onClick={() => {
                                 setEditingVolume({ collectionId: selectedCollection.id, volume: vol });
                                 setEditVolName(vol.name);
                                 setEditVolDesc(vol.description || '');
                                 setEditVolUnits(vol.unitsCount || 12);
                               }} className="p-1.5 text-slate-400 hover:text-purple-400 bg-brand-card rounded border border-brand-border cursor-pointer transition">
                                 <Edit3 className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDeleteVolume(selectedCollection.id, vol.id, vol.name)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-brand-card rounded border border-brand-border cursor-pointer transition">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                         </div>
                      </div>
                    ))}
                    {selectedCollection.volumes.length === 0 && (
                      <div className="p-6 text-center text-slate-500 border border-dashed border-brand-border rounded-lg">
                        No volumes added to this collection yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: PER-UNIT SLIDESHOW STORAGE & MANAGEMENT */}
              {activeSubTab === 'slideshows' && (
                <div className="p-5 space-y-5">
                  {/* Volume Selector Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-400 font-semibold">Select Volume:</span>
                      <div className="flex gap-2">
                        {selectedCollection.volumes.map(vol => (
                          <button
                            key={vol.id}
                            onClick={() => setSelectedVolumeId(vol.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                              (activeVolume?.id === vol.id)
                                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                                : 'bg-brand-dark text-slate-400 border-brand-border hover:text-slate-200'
                            }`}
                          >
                            {vol.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {isAdminUser && (
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="px-3.5 py-2 bg-brand-dark hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Upload / Import Slideshow JSON"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Slides</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setCurrentSlideIndex(0);
                          setIsPresentingClassroom(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <Presentation className="w-4 h-4" />
                        <span>Present Unit {currentUnitSlideshow?.unitNumber || 1}</span>
                      </button>
                    </div>
                  </div>

                  {/* Units Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {currentUnitSlideshows.map(unit => (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                          selectedUnitNumber === unit.unitNumber
                            ? 'bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20'
                            : 'bg-brand-dark/80 border-brand-border hover:border-purple-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              Unit {unit.unitNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {unit.slides.length} Slides
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-100 line-clamp-1">
                            {unit.unitTitle}
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {unit.theme || 'Official curriculum lesson slides'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedUnitNumber(unit.unitNumber);
                              setCurrentSlideIndex(0);
                              setIsPresentingClassroom(true);
                            }}
                            disabled={unit.slides.length === 0}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUnitNumber(unit.unitNumber);
                                handleDownloadSlideshowPPTX();
                              }}
                              disabled={unit.slides.length === 0}
                              className="px-2.5 py-1.5 text-xs text-purple-300 hover:text-white bg-brand-dark hover:bg-purple-600 disabled:opacity-30 border border-purple-500/30 rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Download PowerPoint (.pptx)"
                            >
                              <Presentation className="w-3.5 h-3.5" />
                              <span>.PPTX</span>
                            </button>
                            {isAdminUser && unit.slides.length > 0 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete all slides for Unit ${unit.unitNumber}?`)) {
                                    handleClearUnitSlides(unit.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-white bg-brand-dark hover:bg-rose-600 border border-rose-500/30 rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Delete Slideshow"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ACTIVE UNIT SLIDES MANAGEMENT PANEL */}
                  {currentUnitSlideshow && (
                    <div className="bg-brand-dark rounded-xl border border-brand-border p-5 space-y-4 mt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-purple-300">Unit {currentUnitSlideshow.unitNumber}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs font-bold text-slate-200">{currentUnitSlideshow.unitTitle}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                              {currentUnitSlideshow.slides.length} slides
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isAdminUser 
                              ? 'Manage, edit, reorder, or add custom slides to this official master curriculum unit. Upload a PowerPoint presentation (.pptx) to replace or populate slides.'
                              : 'Curriculum slides overview. Teachers can preview and download official PowerPoint materials.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAdminUser && (
                            <>
                              {currentUnitSlideshow.slides.length > 0 && (
                                <button
                                  onClick={handleClearAllSlides}
                                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  title="Remove all slides from this unit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Clear Slides</span>
                                </button>
                              )}
                              <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="px-3.5 py-1.5 bg-brand-card hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload .PPTX</span>
                              </button>
                              <button
                                onClick={openNewSlideModal}
                                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Slide</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={handleDownloadSlideshowPPTX}
                            disabled={currentUnitSlideshow.slides.length === 0}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Download PowerPoint Presentation"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span>Export .PPTX</span>
                          </button>
                        </div>
                      </div>

                      {/* Slides Cards List or Empty State */}
                      {currentUnitSlideshow.slides.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-brand-border rounded-xl space-y-3 bg-brand-card/40">
                          <Presentation className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-slate-200">No slides in Unit {currentUnitSlideshow.unitNumber} yet</h5>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                              {isAdminUser 
                                ? 'Upload a PowerPoint (.pptx) presentation file or click "+ Add Slide" to author slides for this unit.'
                                : 'No official slides have been published for this unit yet.'}
                            </p>
                          </div>
                          {isAdminUser && (
                            <div className="flex items-center justify-center gap-3 pt-2">
                              <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Upload PowerPoint (.pptx)</span>
                              </button>
                              <button
                                onClick={openNewSlideModal}
                                className="px-4 py-2 bg-brand-card hover:bg-slate-800 text-slate-200 border border-brand-border text-xs font-semibold rounded-xl transition cursor-pointer"
                              >
                                + Add Slide Manually
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentUnitSlideshow.slides.map((slide, sIdx) => (
                          <div key={slide.id || sIdx} className="p-4 bg-brand-card rounded-xl border border-brand-border hover:border-purple-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 font-bold">
                                  Slide {sIdx + 1}
                                </span>
                                <h6 className="text-xs font-bold text-slate-100">{slide.title}</h6>
                                {slide.subtitle && (
                                  <span className="text-[10px] text-slate-400 italic">• {slide.subtitle}</span>
                                )}
                              </div>
                              {slide.content && (
                                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{slide.content}</p>
                              )}
                              {slide.vocabulary && slide.vocabulary.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {slide.vocabulary.map((v, vIdx) => (
                                    <span key={vIdx} className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-purple-300 border border-purple-500/20 font-medium">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Slide Actions (Admin vs Teacher) */}
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setCurrentSlideIndex(sIdx);
                                  setIsPresentingClassroom(true);
                                }}
                                className="p-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                title="Present from this slide"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {isAdminUser && (
                                <>
                                  <button
                                    onClick={() => handleMoveSlide(sIdx, 'up')}
                                    disabled={sIdx === 0}
                                    className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-xs disabled:opacity-20 transition cursor-pointer"
                                    title="Move Slide Up"
                                  >
                                    <MoveUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveSlide(sIdx, 'down')}
                                    disabled={sIdx === currentUnitSlideshow.slides.length - 1}
                                    className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-xs disabled:opacity-20 transition cursor-pointer"
                                    title="Move Slide Down"
                                  >
                                    <MoveDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openEditSlideModal(slide, sIdx)}
                                    className="p-2 bg-brand-dark hover:bg-purple-600 text-slate-300 hover:text-white border border-brand-border rounded-lg text-xs transition cursor-pointer"
                                    title="Edit Slide Content"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlide(sIdx)}
                                    className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg text-xs transition cursor-pointer"
                                    title="Delete Slide"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-brand-card rounded-xl border border-dashed border-brand-border h-full min-h-[400px] flex flex-col items-center justify-center p-10 text-center">
              <h3 className="text-lg font-bold text-slate-300">No Collection Selected</h3>
              <p className="text-slate-500 mt-2 max-w-sm text-xs">
                Select a collection from the catalog to browse volumes and unit slideshows.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EDIT / CREATE SLIDE (ADMIN ONLY) */}
      {isEditingSlide && isAdminUser && currentUnitSlideshow && (
        <SlideEditorModal
          isOpen={isEditingSlide}
          slide={
            slideEditIndex !== null && currentUnitSlideshow.slides[slideEditIndex]
              ? currentUnitSlideshow.slides[slideEditIndex]
              : {
                  id: `sl-${Date.now()}`,
                  title: `Slide ${currentUnitSlideshow.slides.length + 1}`,
                  subtitle: currentUnitSlideshow.unitTitle,
                  content: '',
                  vocabulary: [],
                  grammarRule: '',
                  dialogue: [],
                  bulletPoints: [],
                  boxes: []
                }
          }
          slideIndex={slideEditIndex}
          totalSlidesCount={currentUnitSlideshow.slides.length}
          onSave={handleSaveSlideFromModal}
          onClose={() => setIsEditingSlide(false)}
        />
      )}

      {/* MODAL: UPLOAD / IMPORT SLIDESHOW PPTX (ADMIN ONLY) */}
      {isUploadModalOpen && isAdminUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-xl rounded-2xl border border-brand-border shadow-2xl animate-fadeIn p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Upload PowerPoint Presentation (.pptx) — Unit {currentUnitSlideshow?.unitNumber}</span>
              </h3>
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Upload a standard PowerPoint <code className="text-purple-300 font-bold">.pptx</code> presentation file. The system will automatically parse and convert all slides into interactive classroom materials.
            </p>

            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center space-y-2 cursor-pointer transition ${
                isProcessingPPTX 
                  ? 'border-purple-500 bg-purple-950/30' 
                  : 'border-purple-500/40 hover:border-purple-400 bg-brand-dark/50'
              }`} 
              onClick={() => !isProcessingPPTX && fileInputRef.current?.click()}
            >
              {isProcessingPPTX ? (
                <div className="py-4 space-y-2">
                  <div className="w-8 h-8 mx-auto border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-purple-300">Processing & Parsing PowerPoint slides...</p>
                </div>
              ) : (
                <>
                  <Presentation className="w-10 h-10 mx-auto text-purple-400 opacity-90" />
                  <p className="text-xs font-bold text-slate-100">Click or Drag & Drop PowerPoint File (.pptx)</p>
                  <p className="text-[10px] text-slate-400">Supports modern Microsoft PowerPoint presentations (.pptx) & JSON backups</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.json,application/json"
                onChange={handleFileUpload}
                disabled={isProcessingPPTX}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Or Paste JSON Data (Optional Alternative):</label>
              <textarea
                value={uploadJsonText}
                onChange={e => setUploadJsonText(e.target.value)}
                placeholder='[ { "title": "My Custom Slide", "content": "Instructional text...", "vocabulary": ["Word 1", "Word 2"] } ]'
                className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500 min-h-[90px]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUploadSlideshow}
                disabled={!uploadJsonText.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COLLECTION MODAL */}
      {isCreatingCollection && isAdminUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center p-4 border-b border-brand-border">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <FolderPlus className="w-4 h-4 mr-2 text-purple-400" />
                Create New Collection
              </h3>
              <button type="button" onClick={() => setIsCreatingCollection(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCollection} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Collection Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Next Level English"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={newColCategory}
                  onChange={e => setNewColCategory(e.target.value as BookCollection['category'])}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="General English">General English</option>
                  <option value="Business English">Business English</option>
                  <option value="Exam Prep">Exam Prep (IELTS/TOEFL)</option>
                  <option value="Kids & Teens">Kids & Teens</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Brief summary of the collection..."
                  value={newColDescription}
                  onChange={e => setNewColDescription(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 min-h-[80px]"
                />
              </div>
              
              <div className="bg-brand-dark p-3 rounded-lg border border-brand-border">
                <label className="block text-[11px] font-semibold text-slate-400 mb-2">Initial Volume Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Vol 1, Basic, Starter"
                  value={initialVolumeName}
                  onChange={e => setInitialVolumeName(e.target.value)}
                  className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to create collection without any volumes initially.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE COLLECTION CONFIRM MODAL */}
      {deleteConfirmColId && isAdminUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-sm p-6 rounded-xl border border-rose-500 shadow-2xl animate-fadeIn">
            <h3 className="text-sm font-bold text-rose-400 flex items-center">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Collection?
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Are you sure you want to permanently delete this collection and all its volumes? This cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmColId(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCollection(deleteConfirmColId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

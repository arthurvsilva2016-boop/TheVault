import React, { useState, useRef } from 'react';
import { Group, Employee, BookCollection, GroupCustomSlideshow, SlideItem, WhiteboardFile, UnitSlideshow } from '../types';
import { canEditGroupSlideshow, isCurriculumApprover, isAdmin, isPedagogicalCoordinator } from '../utils/roles';
import { generateDefaultSlideshowsForVolume } from './CollectionsManager';
import VirtualWhiteboard, { WhiteboardSnapshotData } from './VirtualWhiteboard';
import { 
  Presentation, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Download, 
  FileCode, 
  FileText, 
  Eye, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  MoveUp, 
  MoveDown, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Info, 
  Lock, 
  BookOpen, 
  CheckSquare
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { exportSlideshowToPPTX, parsePPTXFile } from '../utils/pptxHelper';

import SlideEditorModal from './SlideEditorModal';

interface GroupSlideshowManagerProps {
  group: Group;
  activeEmployee: Employee;
  employees?: Employee[];
  collections?: BookCollection[];
  onUpdateGroup: (updatedGroup: Group) => void;
  onOpenInClassroom?: (unitNumber: number, slideshowId?: string) => void;
}

export default function GroupSlideshowManager({
  group,
  activeEmployee,
  employees = [],
  collections = [],
  onUpdateGroup,
  onOpenInClassroom
}: GroupSlideshowManagerProps) {
  // Allow edit if admin, coordinator, or assigned teacher
  const canEdit = canEditGroupSlideshow(activeEmployee, group.teacher) || isCurriculumApprover(activeEmployee);
  const isApproverUser = isCurriculumApprover(activeEmployee) || isAdmin(activeEmployee) || isPedagogicalCoordinator(activeEmployee);

  // View state: 'list' | 'editor' | 'presenter'
  const [managerMode, setManagerMode] = useState<'list' | 'editor' | 'presenter'>('list');
  const [activeSlideshow, setActiveSlideshow] = useState<GroupCustomSlideshow | null>(null);

  // Tab filter: 'all' | 'predefined' | 'custom'
  const [slideshowTabFilter, setSlideshowTabFilter] = useState<'all' | 'predefined' | 'custom'>('predefined');

  // Group's assigned book collection & volume resolution
  const defaultCollection = collections.find(c => 
    c.id === group.collectionId || 
    (group.level && c.name.toLowerCase() === group.level.toLowerCase())
  ) || collections[0];

  const [selectedBookCollectionId, setSelectedBookCollectionId] = useState<string>(
    defaultCollection?.id || collections[0]?.id || ''
  );
  
  const activeBookCollection = collections.find(c => c.id === selectedBookCollectionId) || defaultCollection || collections[0];
  
  const defaultVolume = activeBookCollection?.volumes.find(v => v.id === group.volumeId) || activeBookCollection?.volumes[0];
  const [selectedBookVolumeId, setSelectedBookVolumeId] = useState<string>(
    defaultVolume?.id || activeBookCollection?.volumes[0]?.id || ''
  );
  
  const activeBookVolume = activeBookCollection?.volumes.find(v => v.id === selectedBookVolumeId) || activeBookCollection?.volumes[0];

  // Helper to retrieve Predefined Book Unit Slideshows from Collections
  const getPredefinedSlideshows = (): UnitSlideshow[] => {
    if (!activeBookCollection || !activeBookVolume) return [];
    let ssList = activeBookCollection.unitSlideshows?.filter(s => s.volumeId === activeBookVolume.id || !s.volumeId) || [];
    if (ssList.length === 0) {
      ssList = generateDefaultSlideshowsForVolume(
        activeBookCollection.id, 
        activeBookVolume.id, 
        activeBookVolume.name, 
        activeBookVolume.unitsCount || 12
      );
    }
    return ssList;
  };

  const predefinedSlideshows = getPredefinedSlideshows();

  // Launch Predefined Slideshow in Presenter
  const handleLaunchPredefined = (unitSS: UnitSlideshow) => {
    const mapped: GroupCustomSlideshow = {
      id: unitSS.id,
      groupId: group.id,
      unitNumber: unitSS.unitNumber,
      unitTitle: unitSS.unitTitle,
      theme: unitSS.theme || 'Interactive Class Slides',
      embedUrl: unitSS.embedUrl,
      slides: unitSS.slides || [],
      originalCollectionId: unitSS.collectionId,
      originalVolumeId: unitSS.volumeId,
      editedByTeacherId: 'curriculum',
      editedByTeacherName: `${activeBookCollection?.name || 'Master'} (${activeBookVolume?.name || 'Book'})`,
      updatedAt: new Date().toISOString(),
      status: 'approved'
    };
    setActiveSlideshow(mapped);
    setPresenterSlideIndex(0);
    setManagerMode('presenter');
  };

  // Instant Clone of Predefined Slideshow to Group Custom Deck
  const handleClonePredefinedToGroup = (unitSS: UnitSlideshow) => {
    const newCustomDeck: GroupCustomSlideshow = {
      id: `group-ss-${group.id}-${Date.now()}`,
      groupId: group.id,
      unitNumber: unitSS.unitNumber,
      unitTitle: `${unitSS.unitTitle} (Custom)`,
      theme: unitSS.theme || 'Interactive Class Slides',
      slides: JSON.parse(JSON.stringify(unitSS.slides || [])),
      originalCollectionId: unitSS.collectionId,
      originalVolumeId: unitSS.volumeId,
      editedByTeacherId: activeEmployee.id,
      editedByTeacherName: activeEmployee.name,
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };

    const updated = [newCustomDeck, ...customSlideshows];
    onUpdateGroup({
      ...group,
      customSlideshows: updated
    });
    setActiveSlideshow(newCustomDeck);
    setManagerMode('editor');
    showToast(`Cloned Unit ${unitSS.unitNumber} to Group ${group.code} for editing!`);
  };

  // Predefined PPTX & PDF Download Helpers
  const handleDownloadPredefinedPPTX = async (unitSS: UnitSlideshow) => {
    try {
      await exportSlideshowToPPTX(unitSS.slides || [], {
        presentationTitle: `${activeBookCollection?.name || 'Curriculum'} - ${unitSS.unitTitle}`,
        unitNumber: unitSS.unitNumber,
        unitTitle: unitSS.unitTitle,
        theme: unitSS.theme,
        authorName: `${activeBookCollection?.name || 'Master'} Curriculum`
      });
      showToast('PowerPoint downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to export PPTX');
    }
  };

  const handleDownloadPredefinedPDF = (unitSS: UnitSlideshow) => {
    const mapped: GroupCustomSlideshow = {
      id: unitSS.id,
      groupId: group.id,
      unitNumber: unitSS.unitNumber,
      unitTitle: unitSS.unitTitle,
      theme: unitSS.theme,
      slides: unitSS.slides || [],
      editedByTeacherId: 'curriculum',
      editedByTeacherName: 'Master Curriculum',
      updatedAt: new Date().toISOString(),
      status: 'approved'
    };
    handleDownloadPDF(mapped);
  };

  // New Slideshow Creation / Clone Modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneCollectionId, setCloneCollectionId] = useState(collections[0]?.id || '');
  const [cloneVolumeId, setCloneVolumeId] = useState(collections[0]?.volumes[0]?.id || '');
  const [cloneUnitNumber, setCloneUnitNumber] = useState(1);
  const [customUnitTitle, setCustomUnitTitle] = useState('');
  const [customUnitTheme, setCustomUnitTheme] = useState('');

  // Rich Slide Editor Modal State
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [slideEditIndex, setSlideEditIndex] = useState<number | null>(null);

  // Approval Submission Modal (Teacher -> Approver)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  
  // Calculate eligible approvers with solid fallback
  const rawApprovers = employees.filter(e => isCurriculumApprover(e) || isAdmin(e) || isPedagogicalCoordinator(e) || e.isAssociate);
  const eligibleApprovers: Employee[] = rawApprovers.length > 0 ? rawApprovers : (employees.length > 0 ? employees : [activeEmployee]);
  
  const [selectedApproverId, setSelectedApproverId] = useState<string>(eligibleApprovers[0]?.id || activeEmployee.id);
  const [teacherNotes, setTeacherNotes] = useState('');

  // Approver Review Modal (Admin/Coordinator -> Teacher)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecisionNotes, setReviewDecisionNotes] = useState('');

  // Classroom Presenter State
  const [presenterSlideIndex, setPresenterSlideIndex] = useState(0);
  const [isPresenterFullscreen, setIsPresenterFullscreen] = useState(false);
  const [isSideWhiteboardOpen, setIsSideWhiteboardOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const customSlideshows: GroupCustomSlideshow[] = group.customSlideshows || [];

  // -------------------------------------------------------------
  // CLONE / CREATE GROUP SLIDESHOW
  // -------------------------------------------------------------
  const handleStartClone = () => {
    const targetCol = collections.find(c => c.id === cloneCollectionId) || collections[0];
    const targetVol = targetCol?.volumes.find(v => v.id === cloneVolumeId) || targetCol?.volumes[0];
    
    let baseSlides: SlideItem[] = [];
    let baseTitle = `Unit ${cloneUnitNumber}: Custom Lesson`;
    let baseTheme = 'Interactive Class Slides';

    if (targetCol && targetVol) {
      let unitSlideshows = targetCol.unitSlideshows?.filter(s => s.volumeId === targetVol.id || !s.volumeId);
      if (!unitSlideshows || unitSlideshows.length === 0) {
        unitSlideshows = generateDefaultSlideshowsForVolume(targetCol.id, targetVol.id, targetVol.name, targetVol.unitsCount || 12);
      }
      const matchedUnit = unitSlideshows.find(u => u.unitNumber === Number(cloneUnitNumber));
      if (matchedUnit) {
        baseSlides = JSON.parse(JSON.stringify(matchedUnit.slides));
        baseTitle = matchedUnit.unitTitle;
        baseTheme = matchedUnit.theme || baseTheme;
      }
    }

    if (baseSlides.length === 0) {
      baseSlides = [];
    }

    const newCustomSlideshow: GroupCustomSlideshow = {
      id: `group-ss-${group.id}-${Date.now()}`,
      groupId: group.id,
      unitNumber: Number(cloneUnitNumber),
      unitTitle: customUnitTitle.trim() || baseTitle,
      theme: customUnitTheme.trim() || baseTheme,
      slides: baseSlides,
      originalCollectionId: targetCol?.id,
      originalVolumeId: targetVol?.id,
      editedByTeacherId: activeEmployee.id,
      editedByTeacherName: activeEmployee.name,
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };

    const updatedList = [...customSlideshows, newCustomSlideshow];
    onUpdateGroup({
      ...group,
      customSlideshows: updatedList
    });

    setActiveSlideshow(newCustomSlideshow);
    setManagerMode('editor');
    setIsCloneModalOpen(false);
    showToast(`Created custom slideshow for Unit ${cloneUnitNumber}!`);
  };

  // -------------------------------------------------------------
  // SLIDE ITEM EDITING & REORDERING
  // -------------------------------------------------------------
  const handleOpenSlideEditor = (index: number | null) => {
    setSlideEditIndex(index);
    setIsEditingSlide(true);
  };

  const handleSaveSlideFromModal = (completeSlide: SlideItem) => {
    if (!activeSlideshow) return;

    let updatedSlides = [...activeSlideshow.slides];
    if (slideEditIndex !== null && slideEditIndex >= 0 && slideEditIndex < updatedSlides.length) {
      updatedSlides[slideEditIndex] = completeSlide;
    } else {
      updatedSlides.push(completeSlide);
    }

    const updatedSlideshow: GroupCustomSlideshow = {
      ...activeSlideshow,
      slides: updatedSlides,
      updatedAt: new Date().toISOString(),
      // If was approved and teacher modifies it, mark it as draft for re-approval
      status: (activeSlideshow.status === 'approved' && !isApproverUser) ? 'draft' : activeSlideshow.status
    };

    saveSlideshowChanges(updatedSlideshow);
    setActiveSlideshow(updatedSlideshow);
    setIsEditingSlide(false);
    showToast('Slide updated successfully!');
  };

  const handleDeleteSlide = (index: number) => {
    if (!activeSlideshow || activeSlideshow.slides.length <= 1) {
      showToast('A slideshow must contain at least 1 slide.');
      return;
    }
    const updatedSlides = activeSlideshow.slides.filter((_, i) => i !== index);
    const updated: GroupCustomSlideshow = {
      ...activeSlideshow,
      slides: updatedSlides,
      updatedAt: new Date().toISOString()
    };
    saveSlideshowChanges(updated);
    setActiveSlideshow(updated);
    showToast('Slide removed.');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (!activeSlideshow) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activeSlideshow.slides.length) return;

    const slides = [...activeSlideshow.slides];
    const temp = slides[index];
    slides[index] = slides[newIndex];
    slides[newIndex] = temp;

    const updated: GroupCustomSlideshow = {
      ...activeSlideshow,
      slides,
      updatedAt: new Date().toISOString()
    };
    saveSlideshowChanges(updated);
    setActiveSlideshow(updated);
  };

  const saveSlideshowChanges = (updated: GroupCustomSlideshow) => {
    const updatedList = customSlideshows.map(ss => ss.id === updated.id ? updated : ss);
    if (!updatedList.some(ss => ss.id === updated.id)) {
      updatedList.push(updated);
    }
    onUpdateGroup({
      ...group,
      customSlideshows: updatedList
    });
  };

  // -------------------------------------------------------------
  // APPROVAL WORKFLOW
  // -------------------------------------------------------------
  const handleOpenSubmissionModal = (ss: GroupCustomSlideshow) => {
    setActiveSlideshow(ss);
    if (eligibleApprovers.length > 0 && !selectedApproverId) {
      setSelectedApproverId(eligibleApprovers[0].id);
    }
    setTeacherNotes(ss.teacherSubmissionNotes || '');
    setIsSubmissionModalOpen(true);
  };

  const handleSubmitForApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlideshow) return;

    const approver = employees.find(e => e.id === selectedApproverId);
    if (!approver) {
      showToast('Please select an Administrator or Pedagogical Coordinator.');
      return;
    }

    const updated: GroupCustomSlideshow = {
      ...activeSlideshow,
      status: 'pending_approval',
      assignedApproverId: approver.id,
      assignedApproverName: approver.name,
      approverRole: approver.roleTitle,
      teacherSubmissionNotes: teacherNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    saveSlideshowChanges(updated);
    setActiveSlideshow(updated);
    setIsSubmissionModalOpen(false);
    showToast(`Submitted to ${approver.name} (${approver.roleTitle}) for curriculum approval!`);
  };

  const handleOpenReviewModal = (ss: GroupCustomSlideshow) => {
    setActiveSlideshow(ss);
    setReviewDecisionNotes(ss.approvalNotes || '');
    setIsReviewModalOpen(true);
  };

  const handleReviewDecision = (decision: 'approved' | 'rejected') => {
    if (!activeSlideshow) return;

    const updated: GroupCustomSlideshow = {
      ...activeSlideshow,
      status: decision,
      reviewedBy: activeEmployee.name,
      reviewedAt: new Date().toISOString(),
      approvalNotes: reviewDecisionNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    saveSlideshowChanges(updated);
    setActiveSlideshow(updated);
    setIsReviewModalOpen(false);
    showToast(decision === 'approved' ? 'Slideshow approved for classroom use!' : 'Revisions requested from teacher.');
  };

  // -------------------------------------------------------------
  // LAUNCH PRESENTER
  // -------------------------------------------------------------
  const handleLaunchPresenter = (ss: GroupCustomSlideshow) => {
    if (ss.status !== 'approved' && !isApproverUser) {
      showToast('Only approved slideshows can be launched for class sessions.');
      return;
    }
    setActiveSlideshow(ss);
    setPresenterSlideIndex(0);
    setManagerMode('presenter');
  };

  // -------------------------------------------------------------
  // DOWNLOAD POWERPOINT (.PPTX), PDF & JSON
  // -------------------------------------------------------------
  const [isProcessingGroupPPTX, setIsProcessingGroupPPTX] = useState(false);
  const pptxFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadPPTX = async (ss: GroupCustomSlideshow) => {
    if (ss.slides.length === 0) {
      showToast('This slideshow has no slides to export.');
      return;
    }
    try {
      await exportSlideshowToPPTX(ss.slides, {
        presentationTitle: `Group ${group.code} - ${ss.unitTitle}`,
        unitNumber: ss.unitNumber,
        unitTitle: ss.unitTitle,
        theme: ss.theme,
        authorName: ss.editedByTeacherName || activeEmployee.name
      });
      showToast('PowerPoint (.pptx) presentation downloaded!');
    } catch (err: any) {
      console.error('PPTX export error:', err);
      showToast('Failed to export PowerPoint presentation.');
    }
  };

  const handleUploadPPTXToActiveSlideshow = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlideshow) return;

    setIsProcessingGroupPPTX(true);
    try {
      const { slides, presentationTitle } = await parsePPTXFile(file);
      if (slides.length === 0) {
        throw new Error('No slides found in the PowerPoint file.');
      }
      const updated: GroupCustomSlideshow = {
        ...activeSlideshow,
        slides,
        unitTitle: activeSlideshow.unitTitle || presentationTitle || `Unit ${activeSlideshow.unitNumber}`,
        updatedAt: new Date().toISOString()
      };
      saveSlideshowChanges(updated);
      setActiveSlideshow(updated);
      showToast(`Imported ${slides.length} slides from PowerPoint (${file.name})!`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to import PowerPoint file: ${err.message}`);
    } finally {
      setIsProcessingGroupPPTX(false);
      if (pptxFileInputRef.current) pptxFileInputRef.current.value = '';
    }
  };

  const handleDownloadPDF = (ss: GroupCustomSlideshow) => {
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;

      ss.slides.forEach((slide, idx) => {
        if (idx > 0) pdf.addPage();

        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        pdf.setFillColor(30, 41, 59);
        pdf.roundedRect(12, 12, pageWidth - 24, 22, 3, 3, 'F');

        pdf.setTextColor(241, 245, 249);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(slide.title, 18, 22);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(192, 132, 252);
        pdf.text(`Group ${group.code} • ${ss.unitTitle} • Slide ${idx + 1} of ${ss.slides.length}`, 18, 30);

        let curY = 44;
        if (slide.content) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          pdf.setTextColor(226, 232, 240);
          const splitContent = pdf.splitTextToSize(slide.content, pageWidth - 36);
          pdf.text(splitContent, 18, curY);
          curY += splitContent.length * 6 + 6;
        }

        if (slide.vocabulary && slide.vocabulary.length > 0) {
          pdf.setFillColor(59, 130, 246, 0.2);
          pdf.roundedRect(18, curY, pageWidth - 36, 16, 2, 2, 'F');
          pdf.setTextColor(147, 197, 253);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text('TARGET VOCABULARY:', 22, curY + 6);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(241, 245, 249);
          pdf.text(slide.vocabulary.join('   •   '), 22, curY + 11);
          curY += 22;
        }

        if (slide.grammarRule) {
          pdf.setFillColor(168, 85, 247, 0.2);
          pdf.roundedRect(18, curY, pageWidth - 36, 18, 2, 2, 'F');
          pdf.setTextColor(216, 180, 254);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text('GRAMMAR FOCUS & STRUCTURE:', 22, curY + 6);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(241, 245, 249);
          const splitGrammar = pdf.splitTextToSize(slide.grammarRule, pageWidth - 44);
          pdf.text(splitGrammar, 22, curY + 12);
          curY += 24;
        }

        if (slide.bulletPoints && slide.bulletPoints.length > 0) {
          pdf.setTextColor(203, 213, 225);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          slide.bulletPoints.forEach((pt) => {
            if (curY < pageHeight - 20) {
              pdf.text(`• ${pt}`, 22, curY);
              curY += 6;
            }
          });
        }
      });

      pdf.save(`Group_${group.code}_${ss.unitTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF');
    }
  };

  const handleDownloadJSON = (ss: GroupCustomSlideshow) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ss, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `group_${group.code}_unit_${ss.unitNumber}_slideshow.json`);
    dlAnchor.click();
    showToast('JSON export downloaded!');
  };

  const getStatusBadge = (status: GroupCustomSlideshow['status'], ss: GroupCustomSlideshow) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved by {ss.reviewedBy || 'Coordinator'}</span>
          </span>
        );
      case 'pending_approval':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review: {ss.assignedApproverName || 'Administrator'}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Revision Requested</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs font-semibold flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Draft (Teacher Editing)</span>
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // RENDER: PRESENTER MODE
  // -------------------------------------------------------------
  if (managerMode === 'presenter' && activeSlideshow) {
    const currentSlide = activeSlideshow.slides[presenterSlideIndex] || activeSlideshow.slides[0];

    return (
      <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col ${isPresenterFullscreen ? 'p-0' : 'p-4'}`}>
        <div className="bg-slate-900 border border-brand-border rounded-xl flex-1 flex flex-col overflow-hidden shadow-2xl">
          {/* Top Bar */}
          <div className="p-3 bg-brand-dark border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                Group {group.code} • Unit {activeSlideshow.unitNumber}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{activeSlideshow.unitTitle}</h3>
                <p className="text-xs text-slate-400">Slide {presenterSlideIndex + 1} of {activeSlideshow.slides.length}: {currentSlide.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownloadPPTX(activeSlideshow)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Download PowerPoint (.pptx)"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Download .PPTX</span>
              </button>

              <button
                onClick={() => setIsSideWhiteboardOpen(!isSideWhiteboardOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                  isSideWhiteboardOpen ? 'bg-purple-600 text-white border-purple-400' : 'bg-brand-dark text-purple-300 border-purple-500/30 hover:bg-purple-600/30'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>{isSideWhiteboardOpen ? 'Hide Whiteboard' : 'Whiteboard Beside'}</span>
              </button>

              <button
                onClick={() => setIsPresenterFullscreen(!isPresenterFullscreen)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10"
                title="Toggle Fullscreen"
              >
                {isPresenterFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setManagerMode('list')}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Presenter Stage */}
          <div className="flex-1 flex overflow-hidden">
            {/* Slide Viewer */}
            <div className={`${isSideWhiteboardOpen ? 'w-1/2 border-r border-brand-border' : 'w-full'} flex flex-col bg-slate-950 overflow-y-auto ${activeSlideshow.embedUrl ? '' : 'p-6'}`}>
              {activeSlideshow.embedUrl ? (
                <iframe
                  src={activeSlideshow.embedUrl}
                  frameBorder="0"
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="w-full h-full min-h-[500px]"
                ></iframe>
              ) : (
                <>

              <div className="max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-center">
                <div className="border-b border-brand-border/60 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">{currentSlide?.subtitle || 'Lesson Slide'}</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">{currentSlide?.title}</h2>
                </div>

                {currentSlide.content && (
                  <div className="text-slate-200 text-base leading-relaxed bg-brand-card/40 p-4 rounded-xl border border-brand-border/40">
                    {currentSlide.content}
                  </div>
                )}

                {currentSlide.vocabulary && currentSlide.vocabulary.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Target Vocabulary</span>
                    <div className="flex flex-wrap gap-2">
                      {currentSlide.vocabulary.map((v, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-blue-600/30 text-blue-200 border border-blue-500/40 text-xs font-semibold">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentSlide.grammarRule && (
                  <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Grammar Structure</span>
                    <p className="text-sm font-mono text-purple-200 whitespace-pre-wrap">{currentSlide.grammarRule}</p>
                  </div>
                )}

                {currentSlide.dialogue && currentSlide.dialogue.length > 0 && (
                  <div className="bg-brand-card p-4 rounded-xl border border-brand-border space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dialogue Practice</span>
                    <div className="space-y-2">
                      {currentSlide.dialogue.map((d, i) => (
                        <div key={i} className="text-xs sm:text-sm flex gap-2">
                          <span className="font-bold text-purple-400 shrink-0">{d.speaker}:</span>
                          <span className="text-slate-200">{d.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSlide.bulletPoints && currentSlide.bulletPoints.length > 0 && (
                  <ul className="space-y-2 bg-brand-dark/40 p-4 rounded-xl border border-brand-border/40 text-slate-300 text-sm">
                    {currentSlide.bulletPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {currentSlide.exercisePrompt && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Speaking Prompt / Exercise</span>
                    <p className="text-sm font-semibold text-slate-200">{currentSlide.exercisePrompt}</p>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="pt-6 mt-auto border-t border-brand-border flex items-center justify-between">
                <button
                  disabled={presenterSlideIndex === 0}
                  onClick={() => setPresenterSlideIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {activeSlideshow.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPresenterSlideIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition ${
                        i === presenterSlideIndex ? 'bg-purple-500 scale-125' : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>

                <button
                  disabled={presenterSlideIndex === activeSlideshow.slides.length - 1}
                  onClick={() => setPresenterSlideIndex(prev => Math.min(activeSlideshow.slides.length - 1, prev + 1))}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              </>
              )}
            </div>

            {/* Side-by-side Whiteboard */}
            {isSideWhiteboardOpen && (
              <div className="w-1/2 bg-slate-900 flex flex-col p-2 overflow-hidden animate-fadeIn">
                <VirtualWhiteboard
                  boardId={`group_slideshow_wb_${group.id}_${activeSlideshow.id}`}
                  title={`Whiteboard • ${activeSlideshow.unitTitle}`}
                  authorName={activeEmployee.name}
                  heightClass="h-full min-h-[500px]"
                  showTeacherControls={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SLIDESHOW EDITOR MODE
  // -------------------------------------------------------------
  if (managerMode === 'editor' && activeSlideshow) {
    return (
      <div className="space-y-6">
        {/* Editor Top Bar */}
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setManagerMode('list')}
                className="text-xs text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Back to Group Slideshows
              </button>
              <span className="text-slate-500">•</span>
              {getStatusBadge(activeSlideshow.status, activeSlideshow)}
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">{activeSlideshow.unitTitle}</h3>
            <p className="text-xs text-slate-400">
              Customized by {activeSlideshow.editedByTeacherName} • {activeSlideshow.slides.length} slides • Edits affect only Group {group.code}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => pptxFileInputRef.current?.click()}
                  disabled={isProcessingGroupPPTX}
                  className="px-3 py-1.5 bg-brand-dark border border-purple-500/30 rounded-lg text-xs font-semibold text-purple-300 hover:bg-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                  title="Import slides from PowerPoint file (.pptx)"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>{isProcessingGroupPPTX ? 'Importing...' : 'Import .PPTX'}</span>
                </button>
                <input
                  ref={pptxFileInputRef}
                  type="file"
                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleUploadPPTXToActiveSlideshow}
                  className="hidden"
                />
              </>
            )}

            <button
              onClick={() => handleOpenSlideEditor(null)}
              className="px-3 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs font-semibold text-slate-200 hover:bg-brand-card flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>Add Slide</span>
            </button>

            <button
              onClick={() => handleDownloadPPTX(activeSlideshow)}
              disabled={activeSlideshow.slides.length === 0}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download PowerPoint Presentation (.pptx)"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Export .PPTX</span>
            </button>

            <button
              onClick={() => handleDownloadPDF(activeSlideshow)}
              disabled={activeSlideshow.slides.length === 0}
              className="px-3 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs font-semibold text-slate-200 hover:bg-brand-card flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            {canEdit && activeSlideshow.status !== 'approved' && (
              <button
                onClick={() => handleOpenSubmissionModal(activeSlideshow)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Submit for Approval</span>
              </button>
            )}

            {isApproverUser && activeSlideshow.status === 'pending_approval' && (
              <button
                onClick={() => handleOpenReviewModal(activeSlideshow)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Review & Approve</span>
              </button>
            )}

            {(activeSlideshow.status === 'approved' || isApproverUser) && (
              <button
                onClick={() => handleLaunchPresenter(activeSlideshow)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Launch Presentation</span>
              </button>
            )}
          </div>
        </div>

        {/* Approval Feedback Banner */}
        {activeSlideshow.status === 'rejected' && activeSlideshow.approvalNotes && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
            <div className="flex items-center text-xs font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Revision Notes from Reviewer ({activeSlideshow.reviewedBy || 'Coordinator'}):
            </div>
            <p className="text-xs text-slate-200 pl-5">{activeSlideshow.approvalNotes}</p>
          </div>
        )}

        {activeSlideshow.status === 'approved' && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Approved by {activeSlideshow.reviewedBy} on {new Date(activeSlideshow.reviewedAt || activeSlideshow.updatedAt).toLocaleDateString()}. Ready for classroom launch!</span>
            </div>
          </div>
        )}

        {/* Slide List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSlideshow.slides.map((slide, idx) => (
            <div key={slide.id || idx} className="bg-brand-card rounded-xl border border-brand-border p-4 flex flex-col justify-between hover:border-purple-500/40 transition group">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold">
                      Slide {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 mt-1.5">{slide.title}</h4>
                    {slide.subtitle && <p className="text-xs text-slate-400">{slide.subtitle}</p>}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveSlide(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/10"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === activeSlideshow.slides.length - 1}
                      onClick={() => handleMoveSlide(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/10"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {slide.content && <p className="text-xs text-slate-300 line-clamp-2">{slide.content}</p>}

                {slide.vocabulary && slide.vocabulary.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {slide.vocabulary.slice(0, 4).map((v, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {v}
                      </span>
                    ))}
                    {slide.vocabulary.length > 4 && (
                      <span className="text-[10px] text-slate-500">+{slide.vocabulary.length - 4} more</span>
                    )}
                  </div>
                )}

                {slide.grammarRule && (
                  <p className="text-[11px] font-mono text-purple-300 line-clamp-1 bg-purple-500/10 p-1.5 rounded">
                    {slide.grammarRule}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-brand-border/60 flex justify-between items-center">
                <span className="text-[10px] text-slate-500">
                  {slide.bulletPoints?.length ? `${slide.bulletPoints.length} bullets` : 'Slide element'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenSlideEditor(idx)}
                    className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-600 rounded text-xs flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(idx)}
                    className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded text-xs transition"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SLIDESHOWS DIRECTORY / LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Selectors */}
      <div className="bg-brand-card p-5 rounded-xl border border-brand-border flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Presentation className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100">
              Slideshows & Curriculum (Group {group.code})
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access official predefined curriculum slideshows for <strong className="text-purple-300">{activeBookCollection?.name} - {activeBookVolume?.name}</strong>, or build custom tailored decks for Group {group.code}.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {canEdit && (
            <button
              onClick={() => setIsCloneModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow self-start md:self-auto transition"
            >
              <Plus className="w-4 h-4" />
              <span>Customize New Deck</span>
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-purple-600 text-white rounded-lg text-xs font-semibold shadow-lg animate-fadeIn flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Segmented Tab Controls & Collection / Volume Switcher */}
      <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Pills */}
        <div className="flex items-center space-x-1.5 bg-brand-dark p-1 rounded-lg border border-brand-border text-xs">
          <button
            onClick={() => setSlideshowTabFilter('predefined')}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              slideshowTabFilter === 'predefined'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Predefined Book Slideshows</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              slideshowTabFilter === 'predefined' ? 'bg-purple-800 text-purple-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {predefinedSlideshows.length}
            </span>
          </button>

          <button
            onClick={() => setSlideshowTabFilter('custom')}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              slideshowTabFilter === 'custom'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Group Custom Slideshows</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              slideshowTabFilter === 'custom' ? 'bg-purple-800 text-purple-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {customSlideshows.length}
            </span>
          </button>

          <button
            onClick={() => setSlideshowTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              slideshowTabFilter === 'all'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Slides</span>
          </button>
        </div>

        {/* Book Collection & Volume Switcher */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Book Source:</span>
          </span>
          <select
            value={selectedBookCollectionId}
            onChange={(e) => {
              const newColId = e.target.value;
              setSelectedBookCollectionId(newColId);
              const foundCol = collections.find(c => c.id === newColId);
              if (foundCol && foundCol.volumes.length > 0) {
                setSelectedBookVolumeId(foundCol.volumes[0].id);
              }
            }}
            className="bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
          >
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                {col.name} {group.collectionId === col.id ? '(Assigned)' : ''}
              </option>
            ))}
          </select>

          {activeBookCollection && activeBookCollection.volumes.length > 1 && (
            <select
              value={selectedBookVolumeId}
              onChange={(e) => setSelectedBookVolumeId(e.target.value)}
              className="bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {activeBookCollection.volumes.map(vol => (
                <option key={vol.id} value={vol.id}>
                  {vol.name} {group.volumeId === vol.id ? '(Assigned Vol)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: PREDEFINED BOOK SLIDESHOWS FROM COLLECTIONS      */}
      {/* ========================================================= */}
      {(slideshowTabFilter === 'predefined' || slideshowTabFilter === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-slate-200">
                Predefined Book Slideshows • {activeBookCollection?.name} ({activeBookVolume?.name})
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                Official Curriculum
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {predefinedSlideshows.length} unit slideshows available
            </p>
          </div>

          {predefinedSlideshows.length === 0 ? (
            <div className="bg-brand-card rounded-xl border border-brand-border p-8 text-center text-slate-400 text-xs">
              No predefined slideshows found for this volume.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedSlideshows.map((unitSS) => (
                <div
                  key={`predefined-${unitSS.id || unitSS.unitNumber}`}
                  className="bg-brand-card rounded-xl border border-brand-border p-5 flex flex-col justify-between hover:border-purple-500/50 transition space-y-4 shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                        Unit {unitSS.unitNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-semibold flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Predefined Book Deck</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{unitSS.unitTitle}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {unitSS.theme || `${activeBookCollection?.name} Lesson Plan`}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 bg-brand-dark/50 p-2.5 rounded-lg border border-brand-border/40">
                      <div className="flex justify-between">
                        <span>Slide Count:</span>
                        <strong className="text-slate-200">{unitSS.slides?.length || 0} slides</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Curriculum:</span>
                        <strong className="text-purple-300">{activeBookCollection?.name} • {activeBookVolume?.name}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-border flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      {canEdit && (
                        <button
                          onClick={() => handleClonePredefinedToGroup(unitSS)}
                          className="px-2.5 py-1 bg-brand-dark border border-purple-500/30 hover:border-purple-500 rounded text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-600 transition cursor-pointer flex items-center gap-1"
                          title="Clone and tailor slides specifically for this group"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Customize for Group</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadPredefinedPPTX(unitSS)}
                        className="p-1.5 text-purple-400 hover:text-white rounded hover:bg-purple-600/20 cursor-pointer transition"
                        title="Download PowerPoint (.pptx)"
                      >
                        <Presentation className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDownloadPredefinedPDF(unitSS)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-brand-dark cursor-pointer transition"
                        title="Download PDF Handout"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {onOpenInClassroom && (
                        <button
                          onClick={() => onOpenInClassroom(unitSS.unitNumber)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold cursor-pointer border border-brand-border transition"
                          title="Open directly in Classroom studio"
                        >
                          Classroom
                        </button>
                      )}

                      <button
                        onClick={() => handleLaunchPredefined(unitSS)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow transition"
                      >
                        <Presentation className="w-3 h-3" />
                        <span>Launch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION: GROUP CUSTOM TAILORED SLIDESHOWS                 */}
      {/* ========================================================= */}
      {(slideshowTabFilter === 'custom' || slideshowTabFilter === 'all') && (
        <div className="space-y-4 pt-4 border-t border-brand-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-slate-200">
                Group {group.code} Custom Slideshows
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                Teacher Customizations
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {customSlideshows.length} custom decks tailored for this group
            </p>
          </div>

          {customSlideshows.length === 0 ? (
            <div className="bg-brand-card rounded-xl border border-brand-border p-10 text-center space-y-3">
              <Layers className="w-9 h-9 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">No Custom Slideshows for Group {group.code} Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You can directly launch any of the predefined book slideshows above, or click "Customize for Group" on any unit to adapt the vocabulary, grammar, and speaking tasks for Group {group.code}.
              </p>
              {canEdit && (
                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Customize New Unit Slideshow</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customSlideshows.map((ss) => (
                <div key={ss.id} className="bg-brand-card rounded-xl border border-brand-border p-5 flex flex-col justify-between hover:border-purple-500/50 transition space-y-4 shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                        Unit {ss.unitNumber}
                      </span>
                      {getStatusBadge(ss.status, ss)}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{ss.unitTitle}</h4>
                      {ss.theme && <p className="text-xs text-slate-400 mt-0.5">{ss.theme}</p>}
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 bg-brand-dark/50 p-2.5 rounded-lg border border-brand-border/40">
                      <div>Slides count: <strong className="text-slate-200">{ss.slides.length} slides</strong></div>
                      <div>Teacher: <strong className="text-purple-300">{ss.editedByTeacherName}</strong></div>
                      {ss.assignedApproverName && (
                        <div>Approver: <strong className="text-amber-300">{ss.assignedApproverName}</strong></div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-border flex flex-wrap items-center justify-between gap-2">
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          setActiveSlideshow(ss);
                          setManagerMode('editor');
                        }}
                        className="px-2.5 py-1 bg-brand-dark border border-brand-border rounded text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-600 cursor-pointer transition"
                      >
                        Edit Slides
                      </button>

                      <button
                        onClick={() => handleDownloadPPTX(ss)}
                        className="p-1.5 text-purple-400 hover:text-white rounded hover:bg-purple-600/20 cursor-pointer transition"
                        title="Download PowerPoint (.pptx)"
                      >
                        <Presentation className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDownloadPDF(ss)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-brand-dark cursor-pointer transition"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadJSON(ss)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-brand-dark cursor-pointer transition"
                        title="Export JSON"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      {ss.status === 'approved' || isApproverUser ? (
                        <button
                          onClick={() => handleLaunchPresenter(ss)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow transition"
                        >
                          <Presentation className="w-3 h-3" />
                          <span>Launch</span>
                        </button>
                      ) : ss.status === 'pending_approval' ? (
                        isApproverUser ? (
                          <button
                            onClick={() => handleOpenReviewModal(ss)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer transition"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold">Under Review</span>
                        )
                      ) : ss.status === 'draft' && canEdit ? (
                        <button
                          onClick={() => handleOpenSubmissionModal(ss)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold cursor-pointer transition"
                        >
                          Submit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLONE MODAL */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Customize Slideshow for Group {group.code}</span>
              </h4>
              <button onClick={() => setIsCloneModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Source Curriculum Collection</label>
                <select
                  value={cloneCollectionId}
                  onChange={e => {
                    setCloneCollectionId(e.target.value);
                    const c = collections.find(col => col.id === e.target.value);
                    if (c && c.volumes.length > 0) setCloneVolumeId(c.volumes[0].id);
                  }}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Volume</label>
                <select
                  value={cloneVolumeId}
                  onChange={e => setCloneVolumeId(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {collections.find(c => c.id === cloneCollectionId)?.volumes.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Unit Number</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={cloneUnitNumber}
                    onChange={e => setCloneUnitNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Custom Unit Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 3: Advanced Job Interviews"
                    value={customUnitTitle}
                    onChange={e => setCustomUnitTitle(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Lesson Theme / Objectives</label>
                <input
                  type="text"
                  placeholder="e.g. Professional communication, polite requests, conditionals"
                  value={customUnitTheme}
                  onChange={e => setCustomUnitTheme(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleStartClone}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
              >
                Clone & Edit Slides
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE EDIT MODAL */}
      {isEditingSlide && activeSlideshow && (
        <SlideEditorModal
          isOpen={isEditingSlide}
          slide={
            slideEditIndex !== null && activeSlideshow.slides[slideEditIndex]
              ? activeSlideshow.slides[slideEditIndex]
              : {
                  id: `slide-${Date.now()}`,
                  title: `Slide ${activeSlideshow.slides.length + 1}`,
                  subtitle: activeSlideshow.unitTitle,
                  content: '',
                  vocabulary: [],
                  grammarRule: '',
                  dialogue: [],
                  bulletPoints: [],
                  boxes: []
                }
          }
          slideIndex={slideEditIndex}
          totalSlidesCount={activeSlideshow.slides.length}
          onSave={handleSaveSlideFromModal}
          onClose={() => setIsEditingSlide(false)}
        />
      )}

      {/* SUBMIT FOR APPROVAL MODAL */}
      {isSubmissionModalOpen && activeSlideshow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Submit Slideshow for Approval</span>
              </h4>
              <button onClick={() => setIsSubmissionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForApproval} className="space-y-3 text-xs">
              <div className="p-3 bg-brand-dark/80 rounded-lg border border-brand-border space-y-1">
                <span className="text-[11px] font-bold text-purple-300">{activeSlideshow.unitTitle}</span>
                <p className="text-[10px] text-slate-400">
                  Select an Administrator or Pedagogical Coordinator to verify compliance with the pedagogical model before launching this slideshow in Group {group.code}.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Approver (Admin / Coordinator) *</label>
                <select
                  required
                  value={selectedApproverId}
                  onChange={e => setSelectedApproverId(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {eligibleApprovers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.roleTitle || 'Administrator'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Teacher Notes / Model Verification</label>
                <textarea
                  rows={3}
                  placeholder="Explain any pedagogical adjustments, student-tailored vocabulary, or communicative tasks added..."
                  value={teacherNotes}
                  onChange={e => setTeacherNotes(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSubmissionModalOpen(false)}
                  className="px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVER REVIEW MODAL */}
      {isReviewModalOpen && activeSlideshow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Review Custom Slideshow</span>
              </h4>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-brand-dark p-3 rounded-lg border border-brand-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">{activeSlideshow.unitTitle}</span>
                  <span className="text-purple-300 font-mono">Group {group.code}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Submitted by: <strong>{activeSlideshow.editedByTeacherName}</strong>
                </div>
                {activeSlideshow.teacherSubmissionNotes && (
                  <div className="pt-2 mt-1 border-t border-brand-border/50 text-slate-300">
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Teacher Submission Notes:</span>
                    <p className="italic">"{activeSlideshow.teacherSubmissionNotes}"</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approval / Revision Feedback Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide feedback on curriculum alignment or specific slide adjustments..."
                  value={reviewDecisionNotes}
                  onChange={e => setReviewDecisionNotes(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => handleReviewDecision('rejected')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewDecision('approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Approve Slideshow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

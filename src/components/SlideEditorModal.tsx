import React, { useState } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Type, 
  Sparkles, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Eye, 
  Check,
  Palette,
  Upload,
  AlignLeft,
  BookOpen
} from 'lucide-react';
import { SlideItem, SlideBox, SlideImage } from '../types';

interface SlideEditorModalProps {
  isOpen: boolean;
  slide: SlideItem;
  slideIndex: number | null;
  totalSlidesCount?: number;
  onSave: (updatedSlide: SlideItem) => void;
  onClose: () => void;
}

export default function SlideEditorModal({
  isOpen,
  slide,
  slideIndex,
  totalSlidesCount = 0,
  onSave,
  onClose
}: SlideEditorModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(slide.title || '');
  const [subtitle, setSubtitle] = useState(slide.subtitle || '');
  const [content, setContent] = useState(slide.content || '');
  const [vocabInput, setVocabInput] = useState((slide.vocabulary || []).join(', '));
  const [grammarRule, setGrammarRule] = useState(slide.grammarRule || '');
  const [bulletsInput, setBulletsInput] = useState((slide.bulletPoints || []).join('\n'));
  const [dialogueInput, setDialogueInput] = useState(
    (slide.dialogue || []).map(d => `${d.speaker}: ${d.text}`).join('\n')
  );
  const [imageUrl, setImageUrl] = useState(slide.imageUrl || '');
  const [imageCaption, setImageCaption] = useState(slide.imageCaption || '');
  const [exercisePrompt, setExercisePrompt] = useState(slide.exercisePrompt || '');
  const [exerciseAnswer, setExerciseAnswer] = useState(slide.exerciseAnswer || '');
  const [notes, setNotes] = useState(slide.notes || '');
  const [backgroundColor, setBackgroundColor] = useState(slide.backgroundColor || '#0F172A');
  const [themeColor, setThemeColor] = useState(slide.themeColor || '#A855F7');

  // Custom Google-Slides style Boxes
  const [boxes, setBoxes] = useState<SlideBox[]>(slide.boxes || []);
  const [activeTab, setActiveTab] = useState<'content' | 'boxes' | 'media' | 'preview'>('content');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add new custom box
  const handleAddBox = (type: SlideBox['type'] = 'callout') => {
    const newBox: SlideBox = {
      id: `box-${Date.now()}`,
      type,
      title: type === 'callout' ? 'Key Concept' : (type === 'formula' ? 'Grammar Rule' : 'Note Box'),
      content: '',
      backgroundColor: type === 'callout' ? '#1E293B' : (type === 'formula' ? '#3B0764' : '#1E1B4B'),
      borderColor: type === 'callout' ? '#6366F1' : (type === 'formula' ? '#A855F7' : '#38BDF8'),
      textColor: '#F8FAFC',
      fontSize: 'sm',
      alignment: 'left'
    };
    setBoxes([...boxes, newBox]);
    setActiveTab('boxes');
  };

  const handleUpdateBox = (index: number, updates: Partial<SlideBox>) => {
    const updated = [...boxes];
    updated[index] = { ...updated[index], ...updates };
    setBoxes(updated);
  };

  const handleDeleteBox = (index: number) => {
    setBoxes(boxes.filter((_, i) => i !== index));
  };

  // Image Upload handler (converts to base64 Data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be under 5MB.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Slide title is required.');
      setActiveTab('content');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const parsedVocab = vocabInput.split(',').map(v => v.trim()).filter(Boolean);
    const parsedBullets = bulletsInput.split('\n').map(b => b.trim()).filter(Boolean);
    const parsedDialogue = dialogueInput.split('\n').map(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        return { speaker: parts[0].trim(), text: parts.slice(1).join(':').trim() };
      }
      return null;
    }).filter(Boolean) as { speaker: string; text: string }[];

    const finalSlide: SlideItem = {
      ...slide,
      id: slide.id || `slide-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content: content.trim() || undefined,
      vocabulary: parsedVocab.length > 0 ? parsedVocab : undefined,
      grammarRule: grammarRule.trim() || undefined,
      dialogue: parsedDialogue.length > 0 ? parsedDialogue : undefined,
      bulletPoints: parsedBullets.length > 0 ? parsedBullets : undefined,
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      boxes: boxes.length > 0 ? boxes : undefined,
      exercisePrompt: exercisePrompt.trim() || undefined,
      exerciseAnswer: exerciseAnswer.trim() || undefined,
      notes: notes.trim() || undefined,
      backgroundColor,
      themeColor
    };

    onSave(finalSlide);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-brand-border rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-brand-border bg-slate-950 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                {slideIndex !== null ? `Edit Slide ${slideIndex + 1}` : 'Create New Presentation Slide'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure text, images, vocabulary, grammar rules, dialogue & Google-Slides custom boxes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 border-b border-brand-border px-5 gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'content'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Slide Content</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('boxes')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'boxes'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Boxes & Callouts ({boxes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'media'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image & Styling</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 font-medium flex items-center justify-between animate-fadeIn">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: MAIN CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slide Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vocabulary & Collocations"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subtitle / Breadcrumb</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 4 • Business Fluency"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Main Body / Instructional Content</label>
                <textarea
                  rows={3}
                  placeholder="Overview of the lesson topic, context sentences, or discussion instructions..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 font-semibold mb-1">Target Vocabulary (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Agreement, Compromise, Proposal, Deadline"
                    value={vocabInput}
                    onChange={e => setVocabInput(e.target.value)}
                    className="w-full bg-slate-950 border border-blue-500/30 rounded-xl p-2.5 text-blue-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Grammar Rule / Formula</label>
                  <input
                    type="text"
                    placeholder="e.g. Structure: If + Present Simple, will + base verb"
                    value={grammarRule}
                    onChange={e => setGrammarRule(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl p-2.5 text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dialogue Lines (Speaker: Text)</label>
                  <textarea
                    rows={3}
                    placeholder="Alice: Did you finish the slide review?&#10;Bob: Yes, ready to present in class."
                    value={dialogueInput}
                    onChange={e => setDialogueInput(e.target.value)}
                    className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bullet Points (1 per line)</label>
                  <textarea
                    rows={3}
                    placeholder="Key takeaway 1&#10;Key takeaway 2&#10;Discussion question"
                    value={bulletsInput}
                    onChange={e => setBulletsInput(e.target.value)}
                    className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-300 font-semibold mb-1">Classroom Task / Speaking Prompt</label>
                  <input
                    type="text"
                    placeholder="e.g. Ask your partner what they would do in this scenario."
                    value={exercisePrompt}
                    onChange={e => setExercisePrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 text-amber-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Answer Key / Solution (Revealable)</label>
                  <input
                    type="text"
                    placeholder="e.g. Expected answer: 'I would schedule a follow-up meeting.'"
                    value={exerciseAnswer}
                    onChange={e => setExerciseAnswer(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-emerald-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM GOOGLE-SLIDES STYLE BOXES */}
          {activeTab === 'boxes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Custom Slide Boxes & Callouts</h4>
                  <p className="text-slate-400 text-xs">Add independent text cards, formulas, highlighted callouts, and notes to the slide.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBox('callout')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Callout Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBox('formula')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Formula Box</span>
                  </button>
                </div>
              </div>

              {boxes.length === 0 ? (
                <div className="bg-slate-950/60 border border-dashed border-brand-border rounded-xl p-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-semibold">No custom boxes on this slide yet.</p>
                  <p className="text-slate-500 text-xs">Click "+ Add Callout Box" to insert editable styled cards, formulas, or highlight blocks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {boxes.map((box, idx) => (
                    <div key={box.id || idx} className="bg-slate-950 border border-brand-border rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-purple-400 text-xs">Box #{idx + 1} ({box.type})</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBox(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Box Header Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Pro Tip / Key Grammar"
                            value={box.title || ''}
                            onChange={e => handleUpdateBox(idx, { title: e.target.value })}
                            className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Box Style Type</label>
                          <select
                            value={box.type}
                            onChange={e => handleUpdateBox(idx, { type: e.target.value as any })}
                            className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-slate-200"
                          >
                            <option value="callout">Callout Card</option>
                            <option value="formula">Grammar Formula</option>
                            <option value="quote">Quote / Proverb</option>
                            <option value="note">Teacher Note</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Font Size</label>
                          <select
                            value={box.fontSize || 'sm'}
                            onChange={e => handleUpdateBox(idx, { fontSize: e.target.value as any })}
                            className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-slate-200"
                          >
                            <option value="xs">Extra Small (11px)</option>
                            <option value="sm">Small (13px)</option>
                            <option value="base">Normal (15px)</option>
                            <option value="lg">Large (18px)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Box Content Text</label>
                        <textarea
                          rows={2}
                          placeholder="Type content inside this custom box..."
                          value={box.content}
                          onChange={e => handleUpdateBox(idx, { content: e.target.value })}
                          className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA & STYLING */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Slide Image / Illustration</span>
                  </h4>

                  <div>
                    <label className="block text-slate-400 mb-1">Image URL (Web link)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Or Upload Local Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="w-full bg-slate-950 border border-brand-border rounded-xl p-2 text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Image Caption / Credit</label>
                    <input
                      type="text"
                      placeholder="e.g. Figure 1: Team meeting in progress"
                      value={imageCaption}
                      onChange={e => setImageCaption(e.target.value)}
                      className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span>Background & Teacher Notes</span>
                  </h4>

                  <div>
                    <label className="block text-slate-400 mb-1">Slide Theme Accent Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={e => setThemeColor(e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent border border-brand-border cursor-pointer"
                      />
                      <span className="font-mono text-slate-300">{themeColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Teacher / Presenter Notes (Hidden from students)</label>
                    <textarea
                      rows={3}
                      placeholder="Pedagogical prompts, timing suggestions, or answer hints for the teacher..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-brand-border rounded-xl p-2.5 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {imageUrl && (
                <div className="p-3 bg-slate-950 rounded-xl border border-brand-border flex items-center gap-4">
                  <img src={imageUrl} alt="Slide preview" className="w-24 h-16 object-cover rounded-lg border border-brand-border" />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-200 block">Image Attached</span>
                    <span className="text-[11px] text-slate-400 truncate block max-w-md">{imageUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-rose-400 hover:text-rose-300 text-xs px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/40"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="bg-slate-950 border border-brand-border rounded-xl p-6 space-y-4">
              <div className="border-b border-brand-border/60 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">{subtitle || 'Lesson Slide'}</span>
                  <h3 className="text-2xl font-extrabold text-slate-100 mt-0.5">{title || 'Slide Title Preview'}</h3>
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Slide preview" className="w-28 h-20 object-cover rounded-xl border border-brand-border shadow-md" />
                )}
              </div>

              {content && (
                <div className="bg-slate-900/80 p-4 rounded-xl border border-brand-border/60 text-slate-200 text-sm leading-relaxed">
                  {content}
                </div>
              )}

              {vocabInput && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Target Vocabulary</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vocabInput.split(',').map((v, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-200 border border-blue-500/40 text-xs font-semibold">
                        {v.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {grammarRule && (
                <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Grammar Structure</span>
                  <p className="text-xs font-mono text-purple-200">{grammarRule}</p>
                </div>
              )}

              {boxes.map((box, idx) => (
                <div key={idx} className="bg-slate-900 p-3.5 rounded-xl border border-purple-500/40 space-y-1">
                  {box.title && <span className="text-xs font-bold text-purple-300 block">{box.title}</span>}
                  <p className="text-xs text-slate-200 leading-relaxed">{box.content}</p>
                </div>
              ))}

              {exercisePrompt && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Speaking Prompt</span>
                  <p className="text-xs font-semibold text-slate-200">{exercisePrompt}</p>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-brand-border flex justify-between items-center shrink-0">
            <div className="text-xs text-slate-400">
              {boxes.length > 0 && <span>{boxes.length} custom boxes active • </span>}
              {imageUrl && <span>1 image attached • </span>}
              <span>Ready to save</span>
            </div>

            <div className="flex space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Slide Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

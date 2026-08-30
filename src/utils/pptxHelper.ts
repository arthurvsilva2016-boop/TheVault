import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import { SlideItem, SlideBox, SlideImage } from '../types';

export interface PptxExportOptions {
  presentationTitle: string;
  unitNumber?: number;
  unitTitle?: string;
  theme?: string;
  groupCode?: string;
  authorName?: string;
}

/**
 * Generates and downloads a PowerPoint (.pptx) file from an array of SlideItem objects.
 */
export async function exportSlideshowToPPTX(
  slides: SlideItem[],
  options: PptxExportOptions
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_169';
  pptx.author = options.authorName || 'Vault Academic System';
  pptx.company = 'Vault';
  pptx.title = options.unitTitle || options.presentationTitle;

  // Modern Dark Theme Palette
  const BG_DARK = '0F172A'; // Slate 900
  const CARD_BG = '1E293B'; // Slate 800
  const TEXT_WHITE = 'F8FAFC'; // Slate 50
  const TEXT_MUTED = '94A3B8'; // Slate 400
  const ACCENT_PURPLE = 'A855F7'; // Purple 500
  const ACCENT_BLUE = '38BDF8'; // Sky 400
  const ACCENT_AMBER = 'FBBF24'; // Amber 400

  // Title Slide (Slide 0)
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BG_DARK };

  // Top header accent line
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 0.15,
    h: 4.8,
    fill: { color: ACCENT_PURPLE },
    line: { color: ACCENT_PURPLE }
  });

  // Presentation Title
  titleSlide.addText(options.unitTitle || options.presentationTitle, {
    x: 1.2,
    y: 1.6,
    w: 11.0,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: TEXT_WHITE,
    fontFace: 'Calibri'
  });

  // Presentation Subtitle / Metadata
  const subtitleDetails = [
    options.groupCode ? `Group: ${options.groupCode}` : null,
    options.theme ? `Theme: ${options.theme}` : null,
    options.authorName ? `Prepared by: ${options.authorName}` : null,
    `Total Slides: ${slides.length}`
  ].filter(Boolean).join('  |  ');

  if (subtitleDetails) {
    titleSlide.addText(subtitleDetails, {
      x: 1.2,
      y: 3.3,
      w: 11.0,
      h: 0.8,
      fontSize: 16,
      color: ACCENT_PURPLE,
      fontFace: 'Calibri'
    });
  }

  titleSlide.addText('Vault Academic Presentation Studio', {
    x: 1.2,
    y: 5.6,
    w: 11.0,
    h: 0.5,
    fontSize: 11,
    color: TEXT_MUTED,
    fontFace: 'Calibri'
  });

  // Content Slides
  slides.forEach((slide, idx) => {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };

    // Header bar
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 0.4,
      w: 12.13,
      h: 0.9,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: '334155', width: 1 }
    });

    // Slide Title
    s.addText(slide.title || `Slide ${idx + 1}`, {
      x: 0.8,
      y: 0.45,
      w: 9.0,
      h: 0.45,
      fontSize: 18,
      bold: true,
      color: TEXT_WHITE,
      fontFace: 'Calibri'
    });

    // Slide Subtitle / Breadcrumb
    const breadcrumb = [
      options.groupCode ? `Group ${options.groupCode}` : null,
      options.unitTitle ? options.unitTitle : null,
      slide.subtitle ? slide.subtitle : null
    ].filter(Boolean).join(' • ');

    s.addText(breadcrumb || 'Class Lesson', {
      x: 0.8,
      y: 0.85,
      w: 9.0,
      h: 0.35,
      fontSize: 11,
      color: ACCENT_PURPLE,
      fontFace: 'Calibri'
    });

    // Slide Index Number in Header
    s.addText(`${idx + 1} / ${slides.length}`, {
      x: 10.5,
      y: 0.55,
      w: 2.0,
      h: 0.5,
      fontSize: 12,
      align: 'right',
      color: TEXT_MUTED,
      fontFace: 'Calibri'
    });

    let currentY = 1.5;

    // Slide Image (if single or in images array)
    if (slide.imageUrl || (slide.images && slide.images.length > 0)) {
      const primaryImg = slide.imageUrl || slide.images?.[0]?.url;
      if (primaryImg && (primaryImg.startsWith('http') || primaryImg.startsWith('data:image'))) {
        try {
          s.addImage({
            data: primaryImg.startsWith('data:') ? primaryImg : undefined,
            path: primaryImg.startsWith('http') ? primaryImg : undefined,
            x: 8.5,
            y: currentY,
            w: 4.0,
            h: 2.8,
            sizing: { type: 'contain', w: 4.0, h: 2.8 }
          });
        } catch (e) {
          console.warn('Could not embed image in pptx:', e);
        }
      }
    }

    // Slide Content Paragraph
    if (slide.content) {
      s.addText(slide.content, {
        x: 0.8,
        y: currentY,
        w: slide.imageUrl ? 7.2 : 11.7,
        h: 0.9,
        fontSize: 14,
        color: TEXT_WHITE,
        fontFace: 'Calibri'
      });
      currentY += 1.0;
    }

    // Custom Slide Boxes (Google Slides style editable text/callout boxes)
    if (slide.boxes && slide.boxes.length > 0) {
      slide.boxes.forEach((box) => {
        if (currentY >= 6.2) return;
        const boxHeight = box.content.length > 100 ? 1.2 : 0.8;
        const fillHex = box.backgroundColor?.replace('#', '') || (box.type === 'callout' ? '1E293B' : '0F172A');
        const lineHex = box.borderColor?.replace('#', '') || '6366F1';
        const textHex = box.textColor?.replace('#', '') || TEXT_WHITE;

        s.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: currentY,
          w: slide.imageUrl ? 7.2 : 11.7,
          h: boxHeight,
          rectRadius: 0.08,
          fill: { color: fillHex },
          line: { color: lineHex, width: 1 }
        });

        if (box.title) {
          s.addText(box.title.toUpperCase(), {
            x: 1.0,
            y: currentY + 0.06,
            w: slide.imageUrl ? 6.8 : 11.3,
            h: 0.25,
            fontSize: 10,
            bold: true,
            color: ACCENT_PURPLE,
            fontFace: 'Calibri'
          });
        }

        s.addText(box.content, {
          x: 1.0,
          y: currentY + (box.title ? 0.32 : 0.12),
          w: slide.imageUrl ? 6.8 : 11.3,
          h: boxHeight - (box.title ? 0.38 : 0.2),
          fontSize: box.fontSize === 'lg' ? 14 : (box.fontSize === 'sm' ? 11 : 12),
          color: textHex,
          fontFace: 'Calibri'
        });

        currentY += boxHeight + 0.15;
      });
    }

    // Vocabulary Section
    if (slide.vocabulary && slide.vocabulary.length > 0 && currentY < 6.0) {
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: currentY,
        w: slide.imageUrl ? 7.2 : 11.7,
        h: 0.9,
        rectRadius: 0.08,
        fill: { color: '172554' }, // Blue 950
        line: { color: '1D4ED8', width: 1 } // Blue 700
      });

      s.addText('TARGET VOCABULARY', {
        x: 1.0,
        y: currentY + 0.08,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: ACCENT_BLUE,
        fontFace: 'Calibri'
      });

      s.addText(slide.vocabulary.join('   •   '), {
        x: 1.0,
        y: currentY + 0.38,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: 0.45,
        fontSize: 13,
        bold: true,
        color: TEXT_WHITE,
        fontFace: 'Calibri'
      });

      currentY += 1.05;
    }

    // Grammar Structure Section
    if (slide.grammarRule && currentY < 6.0) {
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: currentY,
        w: slide.imageUrl ? 7.2 : 11.7,
        h: 1.0,
        rectRadius: 0.08,
        fill: { color: '3B0764' }, // Purple 950
        line: { color: '7E22CE', width: 1 } // Purple 700
      });

      s.addText('GRAMMAR STRUCTURE & FORM', {
        x: 1.0,
        y: currentY + 0.08,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: ACCENT_PURPLE,
        fontFace: 'Calibri'
      });

      s.addText(slide.grammarRule, {
        x: 1.0,
        y: currentY + 0.35,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: 0.55,
        fontSize: 12,
        color: TEXT_WHITE,
        fontFace: 'Consolas'
      });

      currentY += 1.15;
    }

    // Dialogue Practice
    if (slide.dialogue && slide.dialogue.length > 0 && currentY < 6.0) {
      const dialogueTexts = slide.dialogue.map(d => `${d.speaker}: "${d.text}"`).join('\n');
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: currentY,
        w: slide.imageUrl ? 7.2 : 11.7,
        h: Math.min(1.4, 0.3 + slide.dialogue.length * 0.3),
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: '475569', width: 1 }
      });

      s.addText('DIALOGUE PRACTICE', {
        x: 1.0,
        y: currentY + 0.08,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: ACCENT_AMBER,
        fontFace: 'Calibri'
      });

      s.addText(dialogueTexts, {
        x: 1.0,
        y: currentY + 0.35,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: Math.min(1.0, slide.dialogue.length * 0.3),
        fontSize: 12,
        color: TEXT_WHITE,
        fontFace: 'Calibri'
      });

      currentY += Math.min(1.5, 0.4 + slide.dialogue.length * 0.3);
    }

    // Bullet Points
    if (slide.bulletPoints && slide.bulletPoints.length > 0 && currentY < 6.2) {
      const bulletsObj = slide.bulletPoints.map(pt => ({
        text: pt,
        options: {
          bullet: true,
          color: TEXT_WHITE,
          fontSize: 13,
          fontFace: 'Calibri'
        }
      }));

      s.addText(bulletsObj, {
        x: 0.8,
        y: currentY,
        w: slide.imageUrl ? 7.2 : 11.7,
        h: Math.min(2.5, 7.0 - currentY),
        margin: 0.1
      });

      currentY += Math.min(1.8, slide.bulletPoints.length * 0.35);
    }

    // Speaking Prompt or Exercise
    if (slide.exercisePrompt && currentY < 6.3) {
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: currentY,
        w: slide.imageUrl ? 7.2 : 11.7,
        h: 0.75,
        rectRadius: 0.08,
        fill: { color: '451A03' }, // Amber 950
        line: { color: 'D97706', width: 1 }
      });

      s.addText(`EXERCISE / PROMPT: ${slide.exercisePrompt}`, {
        x: 1.0,
        y: currentY + 0.15,
        w: slide.imageUrl ? 6.8 : 11.3,
        h: 0.5,
        fontSize: 12,
        bold: true,
        color: ACCENT_AMBER,
        fontFace: 'Calibri'
      });
    }
  });

  const sanitizedFileName = (options.unitTitle || options.presentationTitle || 'Slideshow')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const output = await pptx.write({ outputType: 'blob' });
    const blob = output instanceof Blob 
      ? output 
      : new Blob([output as any], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedFileName}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (writeErr) {
    console.warn('pptx.write blob method failed, trying writeFile fallback:', writeErr);
    await pptx.writeFile({ fileName: `${sanitizedFileName}.pptx` });
  }
}

/**
 * Parses an uploaded PowerPoint (.pptx) file into an array of SlideItem objects.
 */
export async function parsePPTXFile(file: File): Promise<{
  presentationTitle?: string;
  slides: SlideItem[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles: { name: string; num: number }[] = [];

  // Find all slide XML files in ppt/slides/slideX.xml
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideFiles.push({
        name: relativePath,
        num: parseInt(match[1], 10)
      });
    }
  });

  // Sort slides in natural order (1, 2, 3...)
  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) {
    throw new Error('No slides found in the PowerPoint (.pptx) file.');
  }

  const slides: SlideItem[] = [];
  const parser = new DOMParser();

  for (let i = 0; i < slideFiles.length; i++) {
    const fileEntry = slideFiles[i];
    const xmlText = await zip.file(fileEntry.name)?.async('text');
    if (!xmlText) continue;

    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // Extract all text paragraphs (<a:p>)
    const paragraphNodes = xmlDoc.getElementsByTagName('a:p');
    const paragraphTexts: string[] = [];

    for (let p = 0; p < paragraphNodes.length; p++) {
      const pNode = paragraphNodes[p];
      const textNodes = pNode.getElementsByTagName('a:t');
      let pText = '';
      for (let t = 0; t < textNodes.length; t++) {
        pText += textNodes[t].textContent || '';
      }
      pText = pText.trim();
      if (pText.length > 0) {
        paragraphTexts.push(pText);
      }
    }

    if (paragraphTexts.length === 0) {
      slides.push({
        id: `slide-pptx-${Date.now()}-${i + 1}`,
        title: `Slide ${i + 1}`,
        subtitle: `Imported from ${file.name}`,
        content: ''
      });
      continue;
    }

    // First line is typically title
    const slideTitle = paragraphTexts[0] || `Slide ${i + 1}`;
    let slideSubtitle: string | undefined = undefined;
    let mainContent = '';
    const bulletPoints: string[] = [];
    const vocabulary: string[] = [];

    if (paragraphTexts.length > 1) {
      for (let j = 1; j < paragraphTexts.length; j++) {
        const text = paragraphTexts[j];
        
        // Detect vocabulary keywords
        if (text.toLowerCase().startsWith('target vocabulary:') || text.toLowerCase().startsWith('vocabulary:')) {
          const vocabPart = text.replace(/^(target )?vocabulary:\s*/i, '');
          const words = vocabPart.split(/[•,;|]/).map(w => w.trim()).filter(Boolean);
          vocabulary.push(...words);
        } else if (text.toLowerCase().startsWith('grammar:') || text.toLowerCase().startsWith('rule:')) {
          mainContent += (mainContent ? '\n\n' : '') + text;
        } else if (text.startsWith('•') || text.startsWith('-') || text.length < 80) {
          const cleanBullet = text.replace(/^[•\-\*]\s*/, '').trim();
          if (cleanBullet) bulletPoints.push(cleanBullet);
        } else {
          mainContent += (mainContent ? '\n\n' : '') + text;
        }
      }
    }

    // Extract shape boxes (<p:sp>)
    const shapeNodes = xmlDoc.getElementsByTagName('p:sp');
    const customBoxes: SlideBox[] = [];

    for (let sIdx = 0; sIdx < shapeNodes.length; sIdx++) {
      const sp = shapeNodes[sIdx];
      const spTextNodes = sp.getElementsByTagName('a:t');
      let shapeText = '';
      for (let st = 0; st < spTextNodes.length; st++) {
        shapeText += spTextNodes[st].textContent || '';
      }
      shapeText = shapeText.trim();
      // If it's a distinct box with substantial text, create a box
      if (shapeText && shapeText !== slideTitle && shapeText.length > 5) {
        customBoxes.push({
          id: `box-${Date.now()}-${sIdx}`,
          type: shapeText.toLowerCase().includes('note') ? 'note' : 'callout',
          content: shapeText,
          backgroundColor: '#1E293B',
          borderColor: '#6366F1',
          textColor: '#F8FAFC'
        });
      }
    }

    slides.push({
      id: `slide-pptx-${Date.now()}-${i + 1}`,
      title: slideTitle,
      subtitle: slideSubtitle,
      content: mainContent || undefined,
      vocabulary: vocabulary.length > 0 ? vocabulary : undefined,
      bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
      boxes: customBoxes.length > 0 ? customBoxes : undefined
    });
  }

  const presentationTitle = file.name.replace(/\.pptx$/i, '');

  return {
    presentationTitle,
    slides
  };
}

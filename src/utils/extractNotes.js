import Tesseract from 'tesseract.js';
import { createWorker } from 'tesseract.js';

// Convertir PDF en image (utiliser pdf.js)
import * as pdfjsLib from 'pdfjs-dist';

// Configurer le worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extraireNotesDepuisPDF(fichierPDF) {
  try {
    console.log('📄 Analyse du bulletin scolaire...');
    
    // Convertir le PDF en image
    const arrayBuffer = await fichierPDF.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Première page
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Extraire le texte avec OCR
    const worker = await createWorker('fra'); // Français
    const { data: { text } } = await worker.recognize(canvas);
    await worker.terminate();
    
    console.log('📝 Texte extrait:', text);
    
    // Analyser les notes
    const notes = analyserTexteNotes(text);
    
    return notes;
  } catch (error) {
    console.error('❌ Erreur extraction:', error);
    throw error;
  }
}

function analyserTexteNotes(texte) {
  const notes = {
    mathematiques: null,
    physique: null,
    chimie: null,
    svt: null,
    francais: null,
    anglais: null,
    histoire: null,
    geographie: null,
    philosophie: null,
    sport: null,
    ses: null,
    si: null
  };
  
  // Patterns pour détecter les matières et leurs notes
  const patterns = {
    mathematiques: /math[ée]matiques?\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    physique: /physique(?:-chimie)?\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    chimie: /chimie\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    svt: /(?:svt|sciences?\s+vie|biologie)\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    francais: /fran[cç]ais\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    anglais: /anglais\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    histoire: /histoire(?:-g[ée]o)?\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    geographie: /g[ée]ographie\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    philosophie: /philo(?:sophie)?\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    sport: /(?:eps|sport|[ée]ducation\s+physique)\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    ses: /(?:ses|[ée]co(?:nomie)?)\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i,
    si: /(?:si|sciences?\s+ing[ée]nieur)\s*:?\s*(\d{1,2}[.,]?\d{0,2})/i
  };
  
  // Extraire chaque note
  for (const [matiere, pattern] of Object.entries(patterns)) {
    const match = texte.match(pattern);
    if (match && match[1]) {
      let note = parseFloat(match[1].replace(',', '.'));
      // S'assurer que la note est entre 0 et 20
      if (note >= 0 && note <= 20) {
        notes[matiere] = note;
      }
    }
  }
  
  return notes;
}

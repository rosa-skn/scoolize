import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extraireNotesDepuisPDF(file) {
  try {
    console.log('Starting bulletin analysis...');
    console.log('File:', file.name, file.type, file.size);
    
    if (!file.type.includes('pdf')) {
      throw new Error('Le fichier doit être un PDF');
    }
    
    console.log('Converting PDF to image...');
    const imageDataUrl = await convertPdfToImage(file);
    
    console.log('Running OCR...');
    const result = await Tesseract.recognize(imageDataUrl, 'fra', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });

    const text = result.data.text;
    console.log('Full extracted text:');
    console.log(text);
    console.log('Text length:', text.length);

    if (!text || text.trim().length === 0) {
      console.warn('No text extracted from PDF');
      return { grades: getEmptyGrades(), personalInfo: getEmptyPersonalInfo() };
    }

    const grades = parseGradesFromText(text);
    const personalInfo = parsePersonalInfoFromText(text);
    
    console.log('Final parsed grades:', grades);
    console.log('Final parsed personal info:', personalInfo);

    const gradesFound = Object.values(grades).filter(g => g !== "").length;
    console.log(`Grades found: ${gradesFound}/12 subjects`);

    return { grades, personalInfo };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

async function convertPdfToImage(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    console.log('PDF converted to image');
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Impossible de lire le PDF: ${error.message}`);
  }
}

function getEmptyGrades() {
  return {
    mathematiques: "",
    physique: "",
    chimie: "",
    svt: "",
    francais: "",
    anglais: "",
    histoire: "",
    geographie: "",
    philosophie: "",
    sport: "",
    ses: "",
    si: ""
  };
}

function getEmptyPersonalInfo() {
  return {
    prenom: "",
    nom: "",
    ine: "",
    dateNaissance: ""
  };
}

function parsePersonalInfoFromText(text) {
  const personalInfo = getEmptyPersonalInfo();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('Extracting personal information...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^INE\s*:/i.test(line)) {
      console.log(`Found INE line: "${line}"`);
      const ineMatch = line.match(/INE\s*:\s*(\w+)/i);
      if (ineMatch) {
        personalInfo.ine = ineMatch[1];
        console.log(`Extracted INE: ${personalInfo.ine}`);
      }
    }

    if (/Née?\s+le/i.test(line)) {
      console.log(`Found birth line: "${line}"`);
      const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        personalInfo.dateNaissance = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log(`Extracted date: ${personalInfo.dateNaissance}`);
      }
    }

    const nameMatch = line.match(/^([A-Z][A-Za-z\s]+)\s+([A-Z][a-z]+)$/);
    if (nameMatch && !personalInfo.nom && !line.includes('INE') && !line.includes('/')) {
      const fullName = line;
      const parts = fullName.trim().split(/\s+/);
      
      if (parts.length >= 2) {
        const lastWord = parts[parts.length - 1];
        const restOfName = parts.slice(0, -1).join(' ');
        
        personalInfo.nom = lastWord;
        personalInfo.prenom = restOfName;
        console.log(`Extracted name: Prénom="${personalInfo.prenom}", Nom="${personalInfo.nom}"`);
      }
    }
  }

  return personalInfo;
}

function parseGradesFromText(text) {
  const grades = getEmptyGrades();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log(`Processing ${lines.length} lines for grades`);

  const subjectPatterns = {
    mathematiques: [/MATH/i, /MATHEMAT/i],
    physique: [/PHYSIQUE/i],
    chimie: [/CHIMIE/i],
    francais: [/FRANCAIS/i, /FRAN[CCS]AIS/i],
    anglais: [/ANGLAIS/i, /LV1/i],
    histoire: [/HISTOIRE/i],
    geographie: [/GEOGRAPHIE/i, /GEOG/i],
    philosophie: [/PHILOSOPHIE/i, /PHILO/i],
    svt: [/SVT/i, /SCIENCES.*VIE/i],
    sport: [/SPORT/i, /EPS/i, /EDUCATION.*PHYSIQUE/i],
    ses: [/\bSES\b/i, /SCIENCES.*ECONOMIQUE/i],
    si: [/SCIENCES.*ING/i, /\bSI\b/i]
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`[${i}] "${line}"`);

    for (const [subject, patterns] of Object.entries(subjectPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          console.log(`  MATCH: "${subject}"`);
          const grade = extractGradeFromTableLine(line, subject);
          if (grade) {
            grades[subject] = grade;
            console.log(`  SUCCESS: ${subject} = ${grade}`);
          }
          break;
        }
      }
    }
  }

  return grades;
}

function extractGradeFromTableLine(line, subject) {
  console.log(`  Extracting grade from table line: "${line}"`);
  
  const allNumbers = line.match(/[\d]{1,2}[.,][\d]{1,2}/g) || [];
  console.log(`  All numbers found: ${allNumbers.join(', ')}`);

  if (allNumbers.length === 0) {
    console.log(`  No numbers found`);
    return null;
  }

  const coefficient = allNumbers[0];
  console.log(`  Suspected coefficient: ${coefficient}`);

  const validGrades = allNumbers.filter(num => {
    const val = parseFloat(num.replace(',', '.'));
    return val >= 0 && val <= 20;
  });

  console.log(`  Valid grades (0-20): ${validGrades.join(', ')}`);

  if (validGrades.length === 0) {
    console.log(`  No valid grades found`);
    return null;
  }

  if (validGrades.length === 1) {
    console.log(`  Only one valid grade, using it`);
    return parseFloat(validGrades[0].replace(',', '.')).toFixed(2);
  }

  let selectedGrade = null;

  if (validGrades.length >= 2) {
    const coef = parseFloat(coefficient.replace(',', '.'));
    
    const gradesAfterCoefficient = validGrades.filter(g => {
      const val = parseFloat(g.replace(',', '.'));
      return val !== coef;
    });

    if (gradesAfterCoefficient.length > 0) {
      selectedGrade = gradesAfterCoefficient[0];
      console.log(`  Using first grade after coefficient: ${selectedGrade}`);
    } else {
      selectedGrade = validGrades[1];
      console.log(`  Using second valid grade: ${selectedGrade}`);
    }
  }

  if (selectedGrade) {
    return parseFloat(selectedGrade.replace(',', '.')).toFixed(2);
  }

  return null;
}

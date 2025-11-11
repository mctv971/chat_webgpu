import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Plus besoin d'importations pour le parsing - on utilise seulement les fichiers .txt

const readFile = promisify(fs.readFile);

export const runtime = 'nodejs';

async function extractTextFromFile(filePath: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  
  try {
    if (ext === '.txt') {
      const textContent = await readFile(filePath, 'utf-8');
      return textContent;
    } else {
      throw new Error(`Format de fichier non supporté: ${ext}. Seuls les fichiers .txt sont acceptés.`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'extraction:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type doit être multipart/form-data' },
        { status: 400 }
      );
    }

    // Méthode alternative pour traiter FormData directement
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérification de la taille du fichier
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale de 10MB' },
        { status: 400 }
      );
    }

    // Vérification du type de fichier
    const allowedExtensions = ['.txt'];
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Type de fichier non supporté. Seuls les fichiers .txt sont autorisés.` },
        { status: 400 }
      );
    }

    // Création d'un fichier temporaire
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${file.name}`);
    
    // Écriture du fichier temporaire
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Extraction du texte
      const extractedText = await extractTextFromFile(tempFilePath, file.name);
      
      return NextResponse.json({
        success: true,
        text: extractedText,
        filename: file.name,
        size: file.size
      });

    } finally {
      // Nettoyage du fichier temporaire
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

  } catch (error: any) {
    console.error('Erreur dans l\'API:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
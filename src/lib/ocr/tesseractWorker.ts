import { createWorker } from 'tesseract.js'
import type { OcrBox, OcrResult } from './ocrTypes'
import type { Language } from '@/types/vocab'

const langMap: Record<Language, string> = {
  en: 'eng',
  fi: 'fin',
  es: 'spa',
}

export async function runOcr(
  imageFile: File,
  language: Language,
  onProgress: (pct: number) => void
): Promise<OcrResult> {
  const worker = await createWorker(langMap[language], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (worker as any).recognize(imageFile, {}, { tsv: true })
  await worker.terminate()

  // Parse TSV output — the most reliable cross-version way to get word bounding boxes.
  // TSV columns: level, page_num, block_num, par_num, line_num, word_num,
  //              left, top, width, height, conf, text
  // Level 5 = individual word
  const tsv: string = (data as any).tsv ?? ''
  const lines = tsv.split('\n').slice(1) // skip header row

  const boxes: OcrBox[] = lines
    .map((line) => line.split('\t'))
    .filter((cols) => cols[0] === '5' && cols[11]?.trim() !== '')
    .map((cols) => {
      const left = Number(cols[6])
      const top = Number(cols[7])
      const width = Number(cols[8])
      const height = Number(cols[9])
      const conf = Number(cols[10])
      const text = cols[11]?.trim() ?? ''
      return {
        id: `${left}-${top}-${text}`,
        text,
        confidence: conf,
        bbox: { x: left, y: top, w: width, h: height },
      }
    })
    .filter((box) => box.text !== '' && box.bbox.w > 0 && box.bbox.h > 0)

  return { language, boxes }
}

export interface OcrBox {
  id: string
  text: string
  confidence: number
  bbox: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface OcrResult {
  language: 'en' | 'fi' | 'es'
  boxes: OcrBox[]
}

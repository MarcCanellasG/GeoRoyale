import { Question } from '../types'

export const culturaGeneralLevel3: Record<string, Question[]> = {
  'galeria-bellas-artes': [
    {
      id: 'q_cul_gal_1',
      question: '¿En qué museo de Madrid se expone el cuadro "El Guernica" de Picasso?',
      options: ['Museo del Prado', 'Museo Reina Sofía', 'Museo Thyssen', 'Museo Sorolla'],
      correctIndex: 1
    },
    {
      id: 'q_cul_gal_2',
      question: '¿Qué estilo artístico abanderaron pintores como Claude Monet y Edgar Degas?',
      options: ['Cubismo', 'Surrealismo', 'Impresionismo', 'Barroco'],
      correctIndex: 2
    }
  ],
  'laboratorio-filosofico': [
    {
      id: 'q_cul_lab_1',
      question: '¿A qué filósofo griego se le atribuye la famosa frase "Solo sé que no sé nada"?',
      options: ['Platón', 'Aristóteles', 'Sócrates', 'Epicuro'],
      correctIndex: 2
    },
    {
      id: 'q_cul_lab_2',
      question: '¿Qué filósofo francés formuló el principio "Pienso, luego existo" (Cogito ergo sum)?',
      options: ['René Descartes', 'Voltaire', 'Jean-Jacques Rousseau', 'Immanuel Kant'],
      correctIndex: 0
    }
  ]
}

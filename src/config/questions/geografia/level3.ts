import { Question } from '../types'

export const geografiaLevel3: Record<string, Question[]> = {
  'cumbre-geopolitica': [
    {
      id: 'q_geo_cum_1',
      question: '¿Qué enclave soberano se encuentra completamente rodeado por la ciudad de Roma?',
      options: ['San Marino', 'Mónaco', 'Ciudad del Vaticano', 'Andorra'],
      correctIndex: 2
    },
    {
      id: 'q_geo_cum_2',
      question: '¿Cuál es el único país del mundo que limita tanto con Brasil como con Francia?',
      options: ['Guyana Francesa (Francia)', 'Surinam', 'Venezuela', 'Colombia'],
      correctIndex: 0
    }
  ],
  'cuenca-regional': [
    {
      id: 'q_geo_cue_1',
      question: '¿Qué río es considerado el más caudaloso y largo del mundo?',
      options: ['Río Nilo', 'Río Amazonas', 'Río Misisipi', 'Río Yangtsé'],
      correctIndex: 1
    },
    {
      id: 'q_geo_cue_2',
      question: '¿Qué lago es el más profundo de la Tierra?',
      options: ['Lago Superior', 'Lago Baikal', 'Lago Titicaca', 'Lago Victoria'],
      correctIndex: 1
    }
  ]
}

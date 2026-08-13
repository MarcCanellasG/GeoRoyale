import { Question } from '../types'

export const geografiaLevel2: Record<string, Question[]> = {
  'metropolis-expansion': [
    {
      id: 'q_geo_met_1',
      question: '¿Qué área metropolitana es la más poblada del mundo?',
      options: ['Tokio', 'Nueva York', 'Shanghái', 'Ciudad de México'],
      correctIndex: 0
    },
    {
      id: 'q_geo_met_2',
      question: '¿Cuál es la capital de Australia?',
      options: ['Sídney', 'Melbourne', 'Canberra', 'Brisbane'],
      correctIndex: 2
    }
  ],
  'reserva-recursos': [
    {
      id: 'q_geo_res_1',
      question: '¿Qué canal artificial une el Mar Mediterráneo con el Mar Rojo?',
      options: ['Canal de Panamá', 'Canal de Suez', 'Canal de Corinto', 'Canal de Kiel'],
      correctIndex: 1
    },
    {
      id: 'q_geo_res_2',
      question: '¿Qué cordillera alberga el monte Everest?',
      options: ['Los Andes', 'Los Alpes', 'El Himalaya', 'Los Urales'],
      correctIndex: 2
    }
  ]
}

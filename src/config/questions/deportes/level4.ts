import { Question } from '../types'

export const deportesLevel4: Record<string, Question[]> = {
  'estadio-olimpico': [
    {
      id: 'q_dep_oli_1',
      question: '¿En qué ciudad se celebraron los primeros Juegos Olímpicos de la Era Moderna en 1896?',
      options: ['París', 'Atenas', 'Londres', 'Berlín'],
      correctIndex: 1
    },
    {
      id: 'q_dep_oli_2',
      question: '¿Quién es el deportista con más medallas de oro olímpicas de toda la historia (23 oros)?',
      options: ['Michael Phelps', 'Usain Bolt', 'Larisa Latýnina', 'Mark Spitz'],
      correctIndex: 0
    },
    {
      id: 'q_dep_oli_3',
      question: '¿En qué año logró la selección española masculinas de fútbol su primer Mundial (Sudáfrica)?',
      options: ['2006', '2008', '2010', '2012'],
      correctIndex: 2
    }
  ]
}

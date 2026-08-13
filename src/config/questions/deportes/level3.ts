import { Question } from '../types'

export const deportesLevel3: Record<string, Question[]> = {
  'circuito-motor': [
    {
      id: 'q_dep_mot_1',
      question: '¿Qué piloto tiene junto a Michael Schumacher el récord de 7 títulos mundiales de Fórmula 1?',
      options: ['Ayrton Senna', 'Lewis Hamilton', 'Fernando Alonso', 'Max Verstappen'],
      correctIndex: 1
    },
    {
      id: 'q_dep_mot_2',
      question: '¿En qué mítico circuito de resistencia se disputa la prueba de las "24 Horas"?',
      options: ['Monza', 'Le Mans', 'Silverstone', 'Spa-Francorchamps'],
      correctIndex: 1
    }
  ],
  'pista-gran-slam': [
    {
      id: 'q_dep_ten_1',
      question: '¿Cuál es el único torneo de tenis del Grand Slam que se juega sobre hierba natural?',
      options: ['Open de Australia', 'Roland Garros', 'Wimbledon', 'US Open'],
      correctIndex: 2
    },
    {
      id: 'q_dep_ten_2',
      question: '¿Qué tenista ostenta el récord de más semanas consecutivas como número 1 del mundo ATP?',
      options: ['Roger Federer', 'Novak Djokovic', 'Pete Sampras', 'Rafael Nadal'],
      correctIndex: 0
    }
  ]
}

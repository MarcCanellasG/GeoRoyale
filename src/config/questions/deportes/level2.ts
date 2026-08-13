import { Question } from '../types'

export const deportesLevel2: Record<string, Question[]> = {
  'cancha-baloncesto': [
    {
      id: 'q_dep_bal_1',
      question: '¿Qué mítico jugador de la NBA lució el dorsal 23 en los Chicago Bulls?',
      options: ['Kobe Bryant', 'LeBron James', 'Michael Jordan', 'Shaquille O’Neal'],
      correctIndex: 2
    },
    {
      id: 'q_dep_bal_2',
      question: '¿A qué distancia se encuentra la línea de triple en la NBA?',
      options: ['6,75 m', '7,24 m', '8,00 m', '6,25 m'],
      correctIndex: 1
    }
  ],
  'puerto-nautico': [
    {
      id: 'q_dep_nau_1',
      question: '¿Cuál es la prenda de color amarillo que distingue al líder del Tour de Francia?',
      options: ['Maillot Amarillo', 'Camiseta Dorada', 'Chaqueta Amarilla', 'Jersey de Oro'],
      correctIndex: 0
    },
    {
      id: 'q_dep_nau_2',
      question: '¿Qué tenista español ha ganado 14 títulos de Roland Garros?',
      options: ['Carlos Alcaraz', 'Rafael Nadal', 'Novak Djokovic', 'Roger Federer'],
      correctIndex: 1
    }
  ]
}

import { Question } from '../types'

export const culturaGeneralLevel4: Record<string, Question[]> = {
  'panteon-sabiduria': [
    {
      id: 'q_cul_pan_1',
      question: '¿Qué escritor ruso redactó las monumentales novelas "Guerra y Paz" y "Anna Karénina"?',
      options: ['Fiódor Dostoyevski', 'León Tolstói', 'Antón Chéjov', 'Aleksandr Pushkin'],
      correctIndex: 1
    },
    {
      id: 'q_cul_pan_2',
      question: '¿En qué año se concedió el primer Premio Nobel de la historia?',
      options: ['1895', '1901', '1914', '1923'],
      correctIndex: 1
    },
    {
      id: 'q_cul_pan_3',
      question: '¿Qué ópera compuso Wolfgang Amadeus Mozart poco antes de su muerte en 1791?',
      options: ['Las bodas de Fígaro', 'Don Giovanni', 'La flauta mágica', 'Così fan tutte'],
      correctIndex: 2
    }
  ]
}

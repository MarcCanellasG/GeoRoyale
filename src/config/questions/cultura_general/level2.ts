import { Question } from '../types'

export const culturaGeneralLevel2: Record<string, Question[]> = {
  'teatro-literario': [
    {
      id: 'q_cul_tea_1',
      question: '¿Quién escribió la famosa tragedia "Romeo y Julieta"?',
      options: ['Miguel de Cervantes', 'William Shakespeare', 'Victor Hugo', 'Dante Alighieri'],
      correctIndex: 1
    },
    {
      id: 'q_cul_tea_2',
      question: '¿Cuál es la obra cumbre de la literatura española escrita por Cervantes?',
      options: ['La Celestina', 'Don Quijote de la Mancha', 'Cantar de mio Cid', 'Don Juan Tenorio'],
      correctIndex: 1
    }
  ],
  'estudio-cinematografico': [
    {
      id: 'q_cul_est_1',
      question: '¿Qué director dirigió la saga de películas de "El Señor de los Anillos"?',
      options: ['Steven Spielberg', 'Christopher Nolan', 'Peter Jackson', 'George Lucas'],
      correctIndex: 2
    },
    {
      id: 'q_cul_est_2',
      question: '¿Qué actor interpretó al personaje del Joker en "El Caballero Oscuro" (2008)?',
      options: ['Joaquin Phoenix', 'Heath Ledger', 'Jack Nicholson', 'Jared Leto'],
      correctIndex: 1
    }
  ]
}

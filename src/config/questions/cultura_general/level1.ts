import { Question } from '../types'

export const culturaGeneralLevel1: Record<string, Question[]> = {
  'plaza-pop': [
    {
      id: 'q_cul_pop_1',
      question: '¿Quién pintó la célebre obra de la "Mona Lisa"?',
      options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'],
      correctIndex: 1
    },
    {
      id: 'q_cul_pop_2',
      question: '¿De qué color es la nariz de los payasos clásicos?',
      options: ['Verde', 'Roja', 'Azul', 'Amarilla'],
      correctIndex: 1
    },
    {
      id: 'q_cul_pop_3',
      question: '¿Qué instrumento musical tiene 88 teclas entre blancas y negras?',
      options: ['Guitarra', 'Violín', 'Piano', 'Flauta'],
      correctIndex: 2
    }
  ],
  'museo-tradiciones': [
    {
      id: 'q_cul_mus_1',
      question: '¿De qué país es originaria la pizza y la pasta?',
      options: ['Grecia', 'Francia', 'Italia', 'España'],
      correctIndex: 2
    },
    {
      id: 'q_cul_mus_2',
      question: '¿Qué festival de luces se celebra tradicionalmente en la India?',
      options: ['Diwali', 'Oktoberfest', 'Hanami', 'Carnaval'],
      correctIndex: 0
    },
    {
      id: 'q_cul_mus_3',
      question: '¿De qué ingredientes principales se compone el guacamole tradicional?',
      options: ['Tomate y queso', 'Aguacate y lima', 'Patata y huevo', 'Garbanzos y sésamo'],
      correctIndex: 1
    }
  ],
  'salon-inventos': [
    {
      id: 'q_cul_inv_1',
      question: '¿Quién es reconocido históricamente por inventar la bombilla incandescente comercial?',
      options: ['Nikola Tesla', 'Thomas Edison', 'Alexander Graham Bell', 'Albert Einstein'],
      correctIndex: 1
    },
    {
      id: 'q_cul_inv_2',
      question: '¿Qué aparato revolucionó la comunicación permitiendo hablar a distancia?',
      options: ['Telégrafo', 'Teléfono', 'Radio', 'Televisión'],
      correctIndex: 1
    },
    {
      id: 'q_cul_inv_3',
      question: '¿Qué inventó Johannes Gutenberg hacia 1440?',
      options: ['La imprenta de tipos móviles', 'La brújula', 'La pólvora', 'El microscopio'],
      correctIndex: 0
    }
  ]
}

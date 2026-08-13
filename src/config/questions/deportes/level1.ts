import { Question } from '../types'

export const deportesLevel1: Record<string, Question[]> = {
  'campo-futbol': [
    {
      id: 'q_dep_fut_1',
      question: '¿Cuántos jugadores de campo tiene cada equipo en un partido de fútbol?',
      options: ['9', '10', '11', '12'],
      correctIndex: 2
    },
    {
      id: 'q_dep_fut_2',
      question: '¿Cada cuántos años se celebra la Copa Mundial de Fútbol de la FIFA?',
      options: ['2 años', '4 años', '5 años', '3 años'],
      correctIndex: 1
    },
    {
      id: 'q_dep_fut_3',
      question: '¿En qué país se originó el fútbol moderno?',
      options: ['Brasil', 'Inglaterra', 'Alemania', 'Argentina'],
      correctIndex: 1
    }
  ],
  'pista-atletismo': [
    {
      id: 'q_dep_atl_1',
      question: '¿Quién ostenta el récord mundial de los 100 metros lisos masculinos con 9.58s?',
      options: ['Carl Lewis', 'Usain Bolt', 'Tyson Gay', 'Yohan Blake'],
      correctIndex: 1
    },
    {
      id: 'q_dep_atl_2',
      question: '¿Cuántos metros mide oficialmente una maratón completa?',
      options: ['40.000m', '42.195m', '45.500m', '50.000m'],
      correctIndex: 1
    },
    {
      id: 'q_dep_atl_3',
      question: '¿De qué color es la bandera con los cinco anillos olímpicos de fondo?',
      options: ['Blanca', 'Azul', 'Dorada', 'Amarilla'],
      correctIndex: 0
    }
  ],
  'polideportivo-general': [
    {
      id: 'q_dep_pol_1',
      question: '¿En qué deporte se utiliza una raqueta y un volante (pluma)?',
      options: ['Bádminton', 'Pádel', 'Tenis de Mesa', 'Squash'],
      correctIndex: 0
    },
    {
      id: 'q_dep_pol_2',
      question: '¿Cuántos puntos vale un tiro libre encestado en baloncesto?',
      options: ['1 punto', '2 puntos', '3 puntos', '4 puntos'],
      correctIndex: 0
    },
    {
      id: 'q_dep_pol_3',
      question: '¿En qué deporte acuático compiten dos equipos intentando meter un balón en la portería contraria?',
      options: ['Natación Sincronizada', 'Waterpolo', 'Surf', 'Piragüismo'],
      correctIndex: 1
    }
  ]
}

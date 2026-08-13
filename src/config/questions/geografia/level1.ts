import { Question } from '../types'

export const geografiaLevel1: Record<string, Question[]> = {
  'archipielago-fisico': [
    {
      id: 'q_geo_arch_1',
      question: '¿Cuál es la isla más grande del mundo por superficie?',
      options: ['Madagascar', 'Groenlandia', 'Borneo', 'Nueva Guinea'],
      correctIndex: 1
    },
    {
      id: 'q_geo_arch_2',
      question: '¿En qué océano se encuentra el archipiélago de Hawái?',
      options: ['Océano Atlántico', 'Océano Índico', 'Océano Pacífico', 'Océano Ártico'],
      correctIndex: 2
    },
    {
      id: 'q_geo_arch_3',
      question: '¿Qué país europeo está formado por más de 7.000 islas en el mar Egeo e Jónico?',
      options: ['Grecia', 'Italia', 'Croacia', 'España'],
      correctIndex: 0
    }
  ],
  'praderas-demograficas': [
    {
      id: 'q_geo_dem_1',
      question: '¿Cuál es la capital oficial de Francia?',
      options: ['Marsella', 'París', 'Lyon', 'Niza'],
      correctIndex: 1
    },
    {
      id: 'q_geo_dem_2',
      question: '¿Qué país tiene la bandera con una hoja de arce roja en el centro?',
      options: ['Canadá', 'Japón', 'Suiza', 'Noruega'],
      correctIndex: 0
    },
    {
      id: 'q_geo_dem_3',
      question: '¿Cuál es el país más extenso del mundo en superficie?',
      options: ['China', 'Estados Unidos', 'Rusia', 'Canadá'],
      correctIndex: 2
    }
  ],
  'valles-cartograficos': [
    {
      id: 'q_geo_val_1',
      question: '¿Qué línea imaginaria divide a la Tierra en hemisferio Norte y Sur?',
      options: ['Meridiano de Greenwich', 'Trópico de Cáncer', 'Ecuador', 'Trópico de Capricornio'],
      correctIndex: 2
    },
    {
      id: 'q_geo_val_2',
      question: '¿Cuántos continentes se consideran habitualmente en la enseñanza hispana?',
      options: ['4', '5', '6', '8'],
      correctIndex: 2
    },
    {
      id: 'q_geo_val_3',
      question: '¿Hacia qué punto cardinal sale el Sol cada mañana?',
      options: ['Norte', 'Este', 'Sur', 'Oeste'],
      correctIndex: 1
    }
  ]
}

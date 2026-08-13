import { Question } from '../types'

export const geografiaLevel4: Record<string, Question[]> = {
  'nodo-sig': [
    {
      id: 'q_geo_sig_1',
      question: '¿Qué punto del océano está considerado el lugar más alejado de cualquier tierra firme (Punto Nemo)?',
      options: ['Fosa de las Marianas', 'Polo del Inaccesibilidad Pacífico', 'Triángulo de las Bermudas', 'Dorsal Mesoatlántica'],
      correctIndex: 1
    },
    {
      id: 'q_geo_sig_2',
      question: '¿Cuál es la capital de la república insular de Nauru?',
      options: ['Yaren (de facto)', 'Suva', 'Tarawa', 'Majuro'],
      correctIndex: 0
    },
    {
      id: 'q_geo_sig_3',
      question: '¿Qué estrecho separa la península de Chukotka en Rusia de Alaska en EEUU?',
      options: ['Estrecho de Malaca', 'Estrecho de Ormuz', 'Estrecho de Bering', 'Estrecho de Magallanes'],
      correctIndex: 2
    }
  ]
}

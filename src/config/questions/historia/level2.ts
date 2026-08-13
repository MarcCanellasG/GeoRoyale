import { Question } from '../types'

export const historiaLevel2: Record<string, Question[]> = {
  'castillo-medieval': [
    {
      id: 'q_his_med_1',
      question: '¿En qué año cayó el Imperio Romano de Occidente, marcando el inicio de la Edad Media?',
      options: ['476 d.C.', '1453 d.C.', '711 d.C.', '1000 d.C.'],
      correctIndex: 0
    },
    {
      id: 'q_his_med_2',
      question: '¿Qué heroína francesa lideró a las tropas galas durante la Guerra de los Cien Años?',
      options: ['Juana de Arco', 'María Antonieta', 'Catalina de Médici', 'Leonor de Aquitania'],
      correctIndex: 0
    }
  ],
  'foro-romano': [
    {
      id: 'q_his_rom_1',
      question: '¿Quién fue el primer emperador del Imperio Romano?',
      options: ['Julio César', 'Augusto (Octavio)', 'Nerón', 'Marco Aurelio'],
      correctIndex: 1
    },
    {
      id: 'q_his_rom_2',
      question: '¿Qué importante erupción volcánica destruyó las ciudades de Pompeya y Herculano en el 79 d.C.?',
      options: ['Monte Etna', 'Monte Vesubio', 'Krakatoa', 'Teide'],
      correctIndex: 1
    }
  ]
}

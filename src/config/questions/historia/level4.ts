import { Question } from '../types'

export const historiaLevel4: Record<string, Question[]> = {
  'archivo-imperios': [
    {
      id: 'q_his_imp_1',
      question: '¿Qué tratado firmado en 1648 puso fin a la Guerra de los Treinta Años y configuró el estado moderno?',
      options: ['Tratado de Versalles', 'Paz de Westfalia', 'Tratado de Tordesillas', 'Paz de Utrech'],
      correctIndex: 1
    },
    {
      id: 'q_his_imp_2',
      question: '¿En qué año se produjo la Caída de Constantinopla marcando el fin del Imperio Bizantino y la Edad Media?',
      options: ['1348', '1453', '1492', '1517'],
      correctIndex: 1
    },
    {
      id: 'q_his_imp_3',
      question: '¿Qué emperador francés fue derrotado definitivamente en la Batalla de Waterloo en 1815?',
      options: ['Napoleón Bonaparte', 'Luis XIV', 'Napoleón III', 'Carlos X'],
      correctIndex: 0
    }
  ]
}

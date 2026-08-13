import { Question } from '../types'

export const historiaLevel1: Record<string, Question[]> = {
  'piramides-egipto': [
    {
      id: 'q_his_egi_1',
      question: '¿Qué gobernantes de la antigüedad eran enterrados en las grandes pirámides de Egipto?',
      options: ['Empresarios', 'Faraones', 'Césares', 'Gladiadores'],
      correctIndex: 1
    },
    {
      id: 'q_his_egi_2',
      question: '¿Qué río fue vital para el surgimiento de la civilización del Antiguo Egipto?',
      options: ['Río Amazonas', 'Río Nilo', 'Río Danubio', 'Río Tigris'],
      correctIndex: 1
    },
    {
      id: 'q_his_egi_3',
      question: '¿Qué famosa reina de Egipto tuvo una relación célebre con Julio César y Marco Antonio?',
      options: ['Nefertiti', 'Hatshepsut', 'Cleopatra VII', 'Cleopatra I'],
      correctIndex: 2
    }
  ],
  'cueva-prehistoria': [
    {
      id: 'q_his_pre_1',
      question: '¿Qué etapa de la historia humana precede a la invención de la escritura?',
      options: ['Edad Moderna', 'Prehistoria', 'Edad Media', 'Renacimiento'],
      correctIndex: 1
    },
    {
      id: 'q_his_pre_2',
      question: '¿Qué animal extinto de gran tamaño con colmillos curvaos cazaban los humanos del Paleolítico?',
      options: ['Mamut', 'Dinosaurio T-Rex', 'Dodo', 'Tigre de Tasmania'],
      correctIndex: 0
    },
    {
      id: 'q_his_pre_3',
      question: '¿Qué cueva prehistórica de Cantabria (España) es célebre por sus pinturas de bisontes?',
      options: ['Cueva de Lascaux', 'Cueva de Altamira', 'Cueva de Nerja', 'Cueva de Chauvet'],
      correctIndex: 1
    }
  ],
  'ruta-descubrimientos': [
    {
      id: 'q_his_des_1',
      question: '¿En qué año llegó Cristóbal Colón a América por primera vez?',
      options: ['1492', '1500', '1453', '1512'],
      correctIndex: 0
    },
    {
      id: 'q_his_des_2',
      question: '¿Qué marino portugués fue el primero en navegar de Europa a la India rodeando África?',
      options: ['Magallanes', 'Vasco da Gama', 'Marco Polo', 'Américo Vespucio'],
      correctIndex: 1
    },
    {
      id: 'q_his_des_3',
      question: '¿Qué expedición completó por primera vez la vuelta al mundo (1519-1522)?',
      options: ['Colón y Pinzón', 'Magallanes y Elcano', 'Pizarro y Cortés', 'Drake y Cook'],
      correctIndex: 1
    }
  ]
}

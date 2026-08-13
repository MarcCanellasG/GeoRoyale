import { Question } from '../types'

export const historiaLevel3: Record<string, Question[]> = {
  'frente-guerra-mundial': [
    {
      id: 'q_his_gue_1',
      question: '¿En qué fecha se produjo el famoso "Desembarco de Normandía" (Día D)?',
      options: ['6 de junio de 1944', '11 de noviembre de 1918', '1 de septiembre de 1939', '8 de mayo de 1945'],
      correctIndex: 0
    },
    {
      id: 'q_his_gue_2',
      question: '¿Qué acontecimiento desencadenó el estallido de la Primera Guerra Mundial en 1914?',
      options: ['El hundimiento del Lusitania', 'El asesinato del Archiduque Francisco Fernando', 'La invasión de Polonia', 'La revolución Rusa'],
      correctIndex: 1
    }
  ],
  'corte-renacentista': [
    {
      id: 'q_his_ren_1',
      question: '¿En qué año estalló la Revolución Francesa con la toma de la Bastilla?',
      options: ['1776', '1789', '1808', '1815'],
      correctIndex: 1
    },
    {
      id: 'q_his_ren_2',
      question: '¿Qué monarca británico rompió con la Iglesia Católica para fundar la Iglesia Anglicana?',
      options: ['Enrique VIII', 'Carlos I', 'Jorge III', 'Guillermo el Conquistador'],
      correctIndex: 0
    }
  ]
}

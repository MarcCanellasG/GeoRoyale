import { Question } from '../types'
import { historiaLevel1 } from './level1'
import { historiaLevel2 } from './level2'
import { historiaLevel3 } from './level3'
import { historiaLevel4 } from './level4'

export const historiaQuestions: Record<string, Question[]> = {
  ...historiaLevel1,
  ...historiaLevel2,
  ...historiaLevel3,
  ...historiaLevel4
}

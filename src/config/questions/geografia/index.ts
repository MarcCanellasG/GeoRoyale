import { Question } from '../types'
import { geografiaLevel1 } from './level1'
import { geografiaLevel2 } from './level2'
import { geografiaLevel3 } from './level3'
import { geografiaLevel4 } from './level4'

export const geografiaQuestions: Record<string, Question[]> = {
  ...geografiaLevel1,
  ...geografiaLevel2,
  ...geografiaLevel3,
  ...geografiaLevel4
}

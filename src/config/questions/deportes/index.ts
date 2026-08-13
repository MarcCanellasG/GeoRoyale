import { Question } from '../types'
import { deportesLevel1 } from './level1'
import { deportesLevel2 } from './level2'
import { deportesLevel3 } from './level3'
import { deportesLevel4 } from './level4'

export const deportesQuestions: Record<string, Question[]> = {
  ...deportesLevel1,
  ...deportesLevel2,
  ...deportesLevel3,
  ...deportesLevel4
}

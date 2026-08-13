import { Question } from '../types'
import { culturaGeneralLevel1 } from './level1'
import { culturaGeneralLevel2 } from './level2'
import { culturaGeneralLevel3 } from './level3'
import { culturaGeneralLevel4 } from './level4'

export const culturaGeneralQuestions: Record<string, Question[]> = {
  ...culturaGeneralLevel1,
  ...culturaGeneralLevel2,
  ...culturaGeneralLevel3,
  ...culturaGeneralLevel4
}

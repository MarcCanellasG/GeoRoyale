export interface Question {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
}

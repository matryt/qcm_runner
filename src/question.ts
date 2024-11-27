export interface Question {
    question: string;
    options: string[];
    correctAnswers: string[];
    imageUrl?: string | null;
}
import { Question } from './question';
import {QuestionState} from './questionState';

let questions: Question[] = [];
let currentQuestion: number = 0;
let userAnswers: string[][] = [];
let questionScores: number[] = [];
let pointsPerCorrectAnswer: number = 0;
let questionStates: QuestionState[] = [];

export function initializeQuiz(quizQuestions: Question[]): void {
    questions = quizQuestions;
    userAnswers = new Array(questions.length).fill(null).map(() => []);
    questionScores = new Array(questions.length).fill(null);
    updateQuestionNav();
    showQuestion();
    calculatePointsPerAnswer();
    goToQuestion(0);
    updateTotalScore();
}

function calculatePointsPerAnswer(): void {
    const totalPoints = parseFloat((document.getElementById('totalPoints') as HTMLInputElement).value);
    const totalCorrectAnswers = questions.reduce((sum, q) => sum + q.correctAnswers.length, 0);
    pointsPerCorrectAnswer = totalPoints / totalCorrectAnswers;
}

function showQuestion(): void {
    const q = questions[currentQuestion];
    const container = document.getElementById('questionContainer')!;

    container.innerHTML = `
    <div class="question">
      <h3>Question ${currentQuestion + 1}/${questions.length}</h3>
      <p>${q.question}</p>
      ${q.correctAnswers.length > 1 ? '<p class="multiple-info">(Sélectionnez toutes les réponses correctes)</p>' : ''}
      <div class="options">
        ${q.options.map((opt, index) => `
          <div class="option">
            <input type="checkbox" name="answer" value="${opt}" id="opt${index}"
              ${userAnswers[currentQuestion].includes(opt) ? 'checked' : ''}>
            <label for="opt${index}">${opt}</label>
          </div>
        `).join('')}
      </div>
      <div class="feedback notDisplayed" id="feedback"></div>
    </div>
  `;

    // Disable answer options if the question has already been answered
    if (userAnswers[currentQuestion].length > 0) {
        document.querySelectorAll('input[name="answer"]').forEach(input => {
            (input as HTMLInputElement).disabled = true;
        });
    }

    updateNavigationButtons();
}

function updateNavigationButtons(): void {
    (document.getElementById('prevBtn') as HTMLButtonElement).disabled = currentQuestion === 0;
    (document.getElementById('nextBtn') as HTMLButtonElement).disabled = currentQuestion === questions.length - 1;
    (document.getElementById('finishBtn') as HTMLButtonElement).classList.toggle('notDisplayed', currentQuestion !== questions.length - 1);
}

function updateQuestionNav(): void {
    const nav = document.getElementById('questionNav')!;
    nav.innerHTML = questions.map((_, index) => `
        <button class="${getQuestionButtonClass(index)}" data-index="${index}">
            ${index + 1}
        </button>
    `).join('');

    nav.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index')!, 10);
            goToQuestion(index);
        });
    });
}

function getQuestionButtonClass(index: number): string {
    if (index === currentQuestion) return 'current-button-page';
    if (userAnswers[index] && userAnswers[index].length > 0) {
        const state = questionStates[index];
        switch (state) {
            case QuestionState.CORRECT:
                return 'correct-button-page';
            case QuestionState.PARTIALLY_CORRECT:
                return 'partial-button-page';
            case QuestionState.INCORRECT:
                return 'incorrect-button-page';
        }
    }
    return 'unanswered-button-page';
}

function goToQuestion(index: number): void {
    currentQuestion = index;
    showQuestion();
    updateQuestionNav();
}

export function showPreviousQuestion(): void {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
        updateQuestionNav();
    }
}

export function showNextQuestion(): void {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
        updateQuestionNav();
    }
}

export function submitAnswer(): void {
    const selectedAnswers = Array.from(document.querySelectorAll('input[name="answer"]:checked'))
        .map(input => (input as HTMLInputElement).value);

    if (selectedAnswers.length === 0) {
        alert('Veuillez sélectionner au moins une réponse');
        return;
    }

    const currentQ = questions[currentQuestion];
    userAnswers[currentQuestion] = selectedAnswers;

    const feedback = document.getElementById('feedback')!;
    const correctAnswers = new Set(currentQ.correctAnswers);
    const userAnswerSet = new Set(selectedAnswers);

    let score = 0;
    const penalty = parseFloat((document.getElementById('penalty') as HTMLInputElement).value);
    let correctAnswersFromUser = 0;

    selectedAnswers.forEach(answer => {
        if (correctAnswers.has(answer)) {
            score += pointsPerCorrectAnswer;
            correctAnswersFromUser++;
        } else {
            score -= penalty;
        }
    });

    currentQ.correctAnswers.forEach(answer => {
        if (!userAnswerSet.has(answer)) {
            score -= penalty;
        }
    });

    score = Math.max(0, score);
    questionScores[currentQuestion] = score;

    let stateType = QuestionState.INCORRECT;

    let infoFeedback = '';
    if (correctAnswersFromUser === currentQ.correctAnswers.length) {
        infoFeedback = "Correct";
        stateType = QuestionState.CORRECT;
    } else if (correctAnswersFromUser > 0) {
        infoFeedback = "Partiellement correct";
        stateType = QuestionState.PARTIALLY_CORRECT;
    } else {
        infoFeedback = "Incorrect";
    }

    questionStates[currentQuestion] = stateType;

    feedback.innerHTML = `
    ${infoFeedback}<br>
    Score pour cette question : ${score.toFixed(2)} points<br>
    Réponses correctes : ${Array.from(correctAnswers).join(', ')}
  `;
    feedback.className = 'feedback ' + getFeedbackClass(stateType);
    feedback.classList.remove('notDisplayed');

    // Disable answer options
    document.querySelectorAll('input[name="answer"]').forEach(input => {
        (input as HTMLInputElement).disabled = true;
    });

    updateQuestionNav();
    updateTotalScore();
}

function updateTotalScore(): void {
    const totalScore = questionScores.reduce((sum, score) => sum + (score || 0), 0);
    const maxPossibleScore = parseFloat((document.getElementById('totalPoints') as HTMLInputElement).value);
    const percentage = (totalScore / maxPossibleScore) * 100;

    document.getElementById('score')!.innerHTML = `
    Score actuel : ${totalScore.toFixed(2)}/${maxPossibleScore} (${percentage.toFixed(1)}%)
  `;
}

export function finishQuiz(): void {
    const totalScore = questionScores.reduce((sum, score) => sum + (score || 0), 0);
    const maxPossibleScore = parseFloat((document.getElementById('totalPoints') as HTMLInputElement).value);
    const percentage = (totalScore / maxPossibleScore) * 100;

    const feedbackContainer = document.getElementById('quizFeedback')!;
    feedbackContainer.innerHTML = `
        <h2>Feedback du Quiz</h2>
        <p>Score total : ${totalScore.toFixed(2)}/${maxPossibleScore} (${percentage.toFixed(1)}%)</p>
        <div class="feedback-questions">
            ${questions.map((q, index) => `
                <div class="feedback-question">
                    <button class="feedback-question-toggle" data-index="${index}">
                        &#9654; Question ${index + 1}: ${q.question}
                    </button>
                    <div class="feedback-question-details notDisplayed" id="feedback-details-${index}">
                        <p>Vos réponses : ${userAnswers[index].join(', ')}</p>
                        <p>Réponses correctes : ${q.correctAnswers.join(', ')}</p>
                        <p>Score : ${questionScores[index]?.toFixed(2) || 0}/${(q.correctAnswers.length * pointsPerCorrectAnswer).toFixed(2)}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        <p>Merci d'avoir participé au quiz !</p>
    `;
    feedbackContainer.classList.remove('notDisplayed');

    document.querySelectorAll('.feedback-question-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index')!, 10);
            const details = document.getElementById(`feedback-details-${index}`)!;
            details.classList.toggle('notDisplayed');
            button.innerHTML = details.classList.contains('notDisplayed')
                ? `&#9654; Question ${index + 1}: ${questions[index].question}`
                : `&#9660; Question ${index + 1}: ${questions[index].question}`;
        });
    });
}

function getFeedbackClass(state: QuestionState) {
    switch (state) {
        case QuestionState.CORRECT: return 'correct';
        case QuestionState.PARTIALLY_CORRECT: return 'partial';
        case QuestionState.INCORRECT: return 'incorrect';
    }
}
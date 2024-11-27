import {QuestionState} from "./questionState";
import {Question} from "./question";

interface QuizSession {
    questions: Question[];
    answers: {
        userAnswers: string[];
        score: number | null;
        state: QuestionState | null;
    }[];
    currentIndex: number;
    pointsPerCorrectAnswer: number;
}

let session: QuizSession = {
    questions: [],
    answers: [],
    currentIndex: 0,
    pointsPerCorrectAnswer: 0
};

export function initializeQuiz(quizQuestions: Question[]): void {
    session.questions = quizQuestions;
    session.answers = quizQuestions.map(() => ({ userAnswers: [], score: null, state: null }));
    updateQuestionNav();
    showQuestion();
    calculatePointsPerAnswer();
    goToQuestion(0);
    updateTotalScore();
}

function calculatePointsPerAnswer(): void {
    const totalPoints = parseFloat((document.getElementById('totalPoints') as HTMLInputElement).value);
    const totalCorrectAnswers = session.questions.reduce((sum, q) => sum + q.correctAnswers.length, 0);
    session.pointsPerCorrectAnswer = totalPoints / totalCorrectAnswers;
}

function showQuestion(): void {
    const q = session.questions[session.currentIndex];
    const container = document.getElementById('questionContainer')!;

    container.innerHTML = `
    <div class="question">
      <h3>Question ${session.currentIndex + 1}/${session.questions.length}</h3>
      <p>${q.question}</p>
      <div class="img-container ${!q.imageUrl ? 'notDisplayed': ''}">
        ${q.imageUrl ? `<img src="${q.imageUrl}" class="image-quiz" alt="Image pour la question">` : ''}
      </div>
      ${q.correctAnswers.length > 1 ? '<p class="multiple-info">(Sélectionnez toutes les réponses correctes)</p>' : ''}
      <div class="options">
        ${q.options.map((opt: string, index: any) => `
          <div class="option">
            <input type="checkbox" name="answer" value="${opt}" id="opt${index}"
              ${session.answers[session.currentIndex].userAnswers.includes(opt) ? 'checked' : ''}>
            <label for="opt${index}">${opt}</label>
          </div>
        `).join('')}
      </div>
      <div class="feedback notDisplayed" id="feedback"></div>
    </div>
  `;

    if (session.answers[session.currentIndex].userAnswers.length > 0) {
        document.querySelectorAll('input[name="answer"]').forEach(input => {
            (input as HTMLInputElement).disabled = true;
        });
    }

    updateNavigationButtons();
}

function updateNavigationButtons(): void {
    (document.getElementById('prevBtn') as HTMLButtonElement).disabled = session.currentIndex === 0;
    (document.getElementById('nextBtn') as HTMLButtonElement).disabled = session.currentIndex === session.questions.length - 1;
    (document.getElementById('finishBtn') as HTMLButtonElement).classList.toggle('notDisplayed', session.currentIndex !== session.questions.length - 1);
}

function updateQuestionNav(): void {
    const nav = document.getElementById('questionNav')!;
    nav.innerHTML = session.questions.map((_, index) => `
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
    if (index === session.currentIndex) return 'current-button-page';
    if (session.answers[index].userAnswers.length > 0) {
        const state = session.answers[index].state;
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
    session.currentIndex = index;
    showQuestion();
    updateQuestionNav();
}

export function showPreviousQuestion(): void {
    if (session.currentIndex > 0) {
        session.currentIndex--;
        showQuestion();
        updateQuestionNav();
    }
}

export function showNextQuestion(): void {
    if (session.currentIndex < session.questions.length - 1) {
        session.currentIndex++;
        showQuestion();
        updateQuestionNav();
    }
}

export function submitAnswer(): void {
    const current = session.answers[session.currentIndex];
    const question = session.questions[session.currentIndex];

    current.userAnswers = Array.from(document.querySelectorAll('input[name="answer"]:checked'))
        .map(input => (input as HTMLInputElement).value);

    if (current.userAnswers.length === 0) {
        alert('Veuillez sélectionner au moins une réponse');
        return;
    }

    const feedback = document.getElementById('feedback')!;
    const correctAnswers = new Set(question.correctAnswers);
    const userAnswerSet = new Set(current.userAnswers);

    let score = 0;
    const penalty = parseFloat((document.getElementById('penalty') as HTMLInputElement).value);
    let correctAnswersFromUser = 0;

    current.userAnswers.forEach(answer => {
        if (correctAnswers.has(answer)) {
            score += session.pointsPerCorrectAnswer;
            correctAnswersFromUser++;
        } else {
            score -= penalty;
        }
    });

    question.correctAnswers.forEach((answer: string) => {
        if (!userAnswerSet.has(answer)) {
            score -= penalty;
        }
    });

    score = Math.max(0, score);
    current.score = score;

    let stateType = QuestionState.INCORRECT;

    let infoFeedback = '';
    if (correctAnswersFromUser === question.correctAnswers.length && correctAnswersFromUser === current.userAnswers.length) {
        infoFeedback = "Correct";
        stateType = QuestionState.CORRECT;
    } else if (correctAnswersFromUser > 0) {
        infoFeedback = "Partiellement correct";
        stateType = QuestionState.PARTIALLY_CORRECT;
    } else {
        infoFeedback = "Incorrect";
    }

    current.state = stateType;

    feedback.innerHTML = `
    ${infoFeedback}<br>
    Score pour cette question : ${score.toFixed(2)} points<br>
    Réponses correctes : ${Array.from(correctAnswers).join(', ')}
  `;
    feedback.className = 'feedback ' + getFeedbackClass(stateType);
    feedback.classList.remove('notDisplayed');

    document.querySelectorAll('input[name="answer"]').forEach(input => {
        (input as HTMLInputElement).disabled = true;
    });

    updateQuestionNav();
    updateTotalScore();
}

function updateTotalScore(): void {
    const totalScore = session.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const maxPossibleScore = parseFloat((document.getElementById('totalPoints') as HTMLInputElement).value);
    const percentage = (totalScore / maxPossibleScore) * 100;

    document.getElementById('score')!.innerHTML = `
    Score actuel : ${totalScore.toFixed(2)}/${maxPossibleScore} (${percentage.toFixed(1)}%)
  `;
}

export function finishQuiz(): void {
    const totalScore = session.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const maxPossibleScore = parseFloat((document.getElementById('totalPoints') as HTMLInputElement).value);
    const percentage = (totalScore / maxPossibleScore) * 100;

    const feedbackContainer = document.getElementById('quizFeedback')!;
    feedbackContainer.innerHTML = `
    <h2>Feedback du Quiz</h2>
    <p>Score total : ${totalScore.toFixed(2)}/${maxPossibleScore} (${percentage.toFixed(1)}%)</p>
    <div class="feedback-questions">
      ${session.questions.map((q, index) => `
        <div class="feedback-question">
          <button class="feedback-question-toggle" data-index="${index}">
            &#9654; Question ${index + 1}: ${q.question}
          </button>
          <div class="feedback-question-details notDisplayed" id="feedback-details-${index}">
            <p>Vos réponses : ${session.answers[index].userAnswers.join(', ')}</p>
            <p>Réponses correctes : ${q.correctAnswers.join(', ')}</p>
            <p>Score : ${session.answers[index].score?.toFixed(2) || 0}/${(q.correctAnswers.length * session.pointsPerCorrectAnswer).toFixed(2)}</p>
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
                ? `&#9654; Question ${index + 1}: ${session.questions[index].question}`
                : `&#9660; Question ${index + 1}: ${session.questions[index].question}`;
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
import { QuestionState } from "./questionState.js";
let session = {
    questions: [],
    answers: [],
    currentIndex: 0,
    pointsPerCorrectAnswer: 0
};
export function initializeQuiz(quizQuestions) {
    session.questions = quizQuestions;
    session.answers = quizQuestions.map(() => ({ userAnswers: [], score: null, state: null }));
    updateQuestionNav();
    showQuestion();
    calculatePointsPerAnswer();
    goToQuestion(0);
    updateTotalScore();
}
function calculatePointsPerAnswer() {
    const totalPoints = parseFloat(document.getElementById('totalPoints').value);
    const totalCorrectAnswers = session.questions.reduce((sum, q) => sum + q.correctAnswers.length, 0);
    session.pointsPerCorrectAnswer = totalPoints / totalCorrectAnswers;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function showQuestion() {
    const q = session.questions[session.currentIndex];
    const container = document.getElementById('questionContainer');
    // Shuffle options
    const shuffledOptions = shuffleArray([...q.options]);
    container.innerHTML = `
    <div class="question">
      <h3>Question ${session.currentIndex + 1}/${session.questions.length}</h3>
      <p>${q.question}</p>
      <div class="img-container ${!q.imageUrl ? 'notDisplayed' : ''}">
        ${q.imageUrl ? `<img src="${q.imageUrl}" class="image-quiz" alt="Image pour la question">` : ''}
      </div>
      ${q.correctAnswers.length > 1 ? '<p class="multiple-info">(Sélectionnez toutes les réponses correctes)</p>' : ''}
      <div class="options">
        ${shuffledOptions.map((opt, index) => `
          <div class="option">
            <input type="checkbox" name="answer" value="${encodeURIComponent(opt)}" id="opt${index}"
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
            input.disabled = true;
        });
    }
    updateNavigationButtons();
}
function updateNavigationButtons() {
    document.getElementById('prevBtn').disabled = session.currentIndex === 0;
    document.getElementById('nextBtn').disabled = session.currentIndex === session.questions.length - 1;
    document.getElementById('finishBtn').classList.toggle('notDisplayed', session.currentIndex !== session.questions.length - 1);
}
function updateQuestionNav() {
    const nav = document.getElementById('questionNav');
    nav.innerHTML = session.questions.map((_, index) => `
    <button class="${getQuestionButtonClass(index)}" data-index="${index}">
      ${index + 1}
    </button>
  `).join('');
    nav.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'), 10);
            goToQuestion(index);
        });
    });
}
function getQuestionButtonClass(index) {
    if (index === session.currentIndex)
        return 'current-button-page';
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
function goToQuestion(index) {
    session.currentIndex = index;
    showQuestion();
    updateQuestionNav();
}
export function showPreviousQuestion() {
    if (session.currentIndex > 0) {
        session.currentIndex--;
        showQuestion();
        updateQuestionNav();
    }
}
export function showNextQuestion() {
    if (session.currentIndex < session.questions.length - 1) {
        session.currentIndex++;
        showQuestion();
        updateQuestionNav();
    }
}
export function submitAnswer() {
    const current = session.answers[session.currentIndex];
    const question = session.questions[session.currentIndex];
    current.userAnswers = Array.from(document.querySelectorAll('input[name="answer"]:checked'))
        .map(input => decodeURIComponent(input.value));
    if (current.userAnswers.length === 0) {
        alert('Veuillez sélectionner au moins une réponse');
        return;
    }
    const feedback = document.getElementById('feedback');
    const correctAnswers = new Set(question.correctAnswers);
    const userAnswerSet = new Set(current.userAnswers);
    let score = 0;
    const penalty = parseFloat(document.getElementById('penalty').value);
    let correctAnswersFromUser = 0;
    current.userAnswers.forEach(answer => {
        if (correctAnswers.has(answer)) {
            score += session.pointsPerCorrectAnswer;
            correctAnswersFromUser++;
        }
        else {
            score -= penalty;
        }
    });
    question.correctAnswers.forEach((answer) => {
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
    }
    else if (correctAnswersFromUser > 0) {
        infoFeedback = "Partiellement correct";
        stateType = QuestionState.PARTIALLY_CORRECT;
    }
    else {
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
        input.disabled = true;
    });
    updateQuestionNav();
    updateTotalScore();
}
function toggleQuestionDetails(index) {
    var _a;
    const details = document.getElementById(`question-details-${index}`);
    (_a = details === null || details === void 0 ? void 0 : details.parentElement) === null || _a === void 0 ? void 0 : _a.classList.toggle('open');
}
function updateTotalScore() {
    const totalScore = session.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const maxPossibleScore = parseFloat(document.getElementById('totalPoints').value);
    const percentage = (totalScore / maxPossibleScore) * 100;
    document.getElementById('score').innerHTML = `
    Score actuel : ${totalScore.toFixed(2)}/${maxPossibleScore} (${percentage.toFixed(1)}%)
  `;
}
export function finishQuiz() {
    const totalScore = session.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    const maxPossibleScore = parseFloat(document.getElementById('totalPoints').value);
    const percentage = (totalScore / maxPossibleScore) * 100;
    const feedbackContainer = document.getElementById('quizFeedback');
    // @ts-ignore
    feedbackContainer.innerHTML = session.questions.map((q, index) => {
        var _a;
        return `
        <div class="feedback-question" id="feedback-question-${index}">
            <div class="question-title">
            Question ${index + 1}
            <span class="toggle-icon" id="toggle-icon-${index}">▼</span>
            </div>
            <div class="question-score">Score: ${((_a = session.answers[index].score) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 0}/${(q.correctAnswers.length * session.pointsPerCorrectAnswer).toFixed(2)}</div>
            <div class="question-details" id="question-details-${index}">
                <p>${q.question}</p>
                <p>
                <strong>Réponses choisies:</strong>
                ${session.answers[index].userAnswers.length > 0 ? `<ul>${session.answers[index].userAnswers.map(answer => `<li>${answer}</li>`).join('')}</ul>` : 'aucune'}</p>
                <p><strong>Réponses correctes:</strong></p>
                <ul>
                    ${q.correctAnswers.map(answer => `<li>${answer}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    }).join('');
    session.questions.forEach((_, index) => {
        const questionElement = document.getElementById(`feedback-question-${index}`);
        const toggleIcon = document.getElementById(`toggle-icon-${index}`);
        questionElement === null || questionElement === void 0 ? void 0 : questionElement.addEventListener('click', () => {
            toggleQuestionDetails(index);
            toggleIcon.textContent = toggleIcon.textContent === '▼' ? '▶' : '▼';
        });
    });
    // @ts-ignore
    feedbackContainer.classList.remove('notDisplayed');
}
function getFeedbackClass(state) {
    switch (state) {
        case QuestionState.CORRECT: return 'correct';
        case QuestionState.PARTIALLY_CORRECT: return 'partial';
        case QuestionState.INCORRECT: return 'incorrect';
    }
}

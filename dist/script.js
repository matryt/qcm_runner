import { validateCSVFormat } from './csvHandler.js';
import { initializeQuiz, showPreviousQuestion, showNextQuestion, submitAnswer, finishQuiz as finish } from './quiz.js';
let questions = [];
document.getElementById('validateImport').addEventListener('click', handleFileImport);
const dropZone = document.querySelector('.drop-zone');
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleFileDrop);
const fileInput = document.getElementById('csvFile');
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        displayFileName(file.name);
    }
});
dropZone.addEventListener('click', () => fileInput.click());
document.getElementById('startQuiz').addEventListener('click', startQuiz);
document.getElementById('prevBtn').addEventListener('click', showPreviousQuestion);
document.getElementById('nextBtn').addEventListener('click', showNextQuestion);
document.getElementById('submitBtn').addEventListener('click', submitAnswer);
document.getElementById('finishBtn').addEventListener('click', finishQuiz);
document.getElementById('restartBtn').addEventListener('click', restartQuiz);
function handleFileImport() {
    resetImportFeedback();
    const file = document.getElementById('csvFile').files[0];
    if (!file) {
        alert('Veuillez sélectionner un fichier CSV');
        return;
    }
    if (!file.name.endsWith('.csv')) {
        document.getElementById('fileStatus').innerHTML = `<span class="error">✗ Extension de fichier incorrecte</span>`;
        return;
    }
    displayFileName(file.name);
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const csvData = event.target.result;
            questions = validateCSVFormat(csvData);
            displayFormatPreview();
            showStep(2);
        }
        catch (error) {
            document.getElementById('errors').innerHTML = `<span class="error">✗ ${error.message}</span>`;
        }
    };
    reader.onerror = function () {
        document.getElementById('errors').innerHTML = '<span class="error">✗ Erreur lors de la lecture du fichier</span>';
    };
    reader.readAsText(file);
}
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}
function handleFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file.name.endsWith('.csv')) {
        document.getElementById('fileStatus').innerHTML = `<span class="error">✗ Extension de fichier incorrecte</span>`;
        return;
    }
    const fileInput = document.getElementById('csvFile');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    displayFileName(file.name);
}
function displayFileName(fileName) {
    document.getElementById('fileStatus').innerHTML = `<span class="success">✓ Fichier sélectionné : ${fileName}</span>`;
}
function displayFormatPreview() {
    const preview = questions.map((q, index) => ({
        index: index + 1,
        question: q.question,
        nbOptions: q.options.length
    }));
    document.getElementById('formatPreview').classList.remove('notDisplayed');
    document.getElementById('formatPreviewContent').innerHTML =
        preview.map(q => `
      <tr>
        <td>${q.index}</td>
        <td>${q.question}</td>
        <td>${q.nbOptions}</td>
      </tr>
    `).join('');
}
function startQuiz() {
    initializeQuiz(questions);
    showStep(3);
}
function finishQuiz() {
    finish();
    showStep(4);
}
function restartQuiz() {
    showStep(1);
    resetImport();
    resetImportFeedback();
}
function resetImport() {
    const fileInput = document.getElementById('csvFile');
    fileInput.value = '';
}
function resetImportFeedback() {
    document.getElementById("fileStatus").innerHTML = '';
}
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('notDisplayed', index !== stepNumber - 1);
    });
}

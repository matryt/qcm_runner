import { validateCSVFormat } from './csvHandler';
import { initializeQuiz, showPreviousQuestion, showNextQuestion, submitAnswer, finishQuiz as finish } from './quiz';
import { Question } from './question';

let questions: Question[] = [];

document.getElementById('validateImport')!.addEventListener('click', handleFileImport);
document.getElementById('startQuiz')!.addEventListener('click', startQuiz);
document.getElementById('prevBtn')!.addEventListener('click', showPreviousQuestion);
document.getElementById('nextBtn')!.addEventListener('click', showNextQuestion);
document.getElementById('submitBtn')!.addEventListener('click', submitAnswer);
document.getElementById('finishBtn')!.addEventListener('click', finishQuiz);
document.getElementById('restartBtn')!.addEventListener('click', restartQuiz);

function handleFileImport(): void {
    resetImportFeedback();
    const file = (document.getElementById('csvFile') as HTMLInputElement).files![0];
    if (!file) {
        alert('Veuillez sélectionner un fichier CSV');
        return;
    }
    if (!file.name.endsWith('.csv')) {
        document.getElementById('fileStatus')!.innerHTML = `<span class="error">✗ Extension de fichier incorrecte</span>`;
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event: ProgressEvent<FileReader>) {
        try {
            const csvData = event.target!.result as string;
            questions = validateCSVFormat(csvData);
            displayFormatPreview();
            showStep(2);
        } catch (error) {
            document.getElementById('fileStatus')!.innerHTML = `<span class="error">✗ ${(error as Error).message}</span>`;
        }
    };

    reader.onerror = function() {
        document.getElementById('fileStatus')!.innerHTML = '<span class="error">✗ Erreur lors de la lecture du fichier</span>';
    };

    reader.readAsText(file);
}

function displayFormatPreview(): void {
    const preview = questions.map((q, index) => ({
        index: index + 1,
        question: q.question,
        nbOptions: q.options.length
    }));

    document.getElementById('formatPreview')!.classList.remove('notDisplayed');
    document.getElementById('formatPreviewContent')!.innerHTML =
        preview.map(q => `
      <tr>
        <td>${q.index}</td>
        <td>${q.question}</td>
        <td>${q.nbOptions}</td>
      </tr>
    `).join('');
}

function startQuiz(): void {
    initializeQuiz(questions);
    showStep(3);
}

function finishQuiz(): void {
    finish();
    showStep(4);
}

function restartQuiz(): void {
    showStep(1);
    resetImport();
    resetImportFeedback();
}

function resetImport(): void {
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    fileInput.value = '';
}

function resetImportFeedback(): void {
    (document.getElementById("fileStatus") as HTMLElement).innerHTML = '';
}

function showStep(stepNumber: number): void {
    document.querySelectorAll('.step').forEach((step, index) => {
        (step as HTMLElement).classList.toggle('notDisplayed', index !== stepNumber - 1);
    });
}
export function validateCSVFormat(csvData) {
    const lines = csvData.trim().split('\n');
    const errors = [];
    const questions = [];
    if (lines.length < 1) {
        throw new Error('Le fichier est vide');
    }
    lines.forEach((line, index) => {
        if (!line.trim())
            return;
        console.log(line);
        const parts = line.split(/,(?=[a-zA-Z0-9])/).map(part => part.trim());
        console.log(parts);
        if (parts.length < 3) {
            errors.push(`Ligne ${index + 1}: Pas assez de colonnes (minimum: question, une option, réponses)`);
            return;
        }
        const question = parts[0];
        const correctAnswersStr = parts[parts.length - 1];
        const options = parts.slice(1, -1);
        const correctAnswers = correctAnswersStr.split(';').map(ans => ans.trim());
        if (question.length < 3) {
            errors.push(`Ligne ${index + 1}: Question trop courte`);
        }
        if (options.length < 2) {
            errors.push(`Ligne ${index + 1}: Il faut au moins 2 options de réponse`);
        }
        if (correctAnswers.length < 1) {
            errors.push(`Ligne ${index + 1}: Aucune réponse correcte spécifiée`);
        }
        correctAnswers.forEach(answer => {
            if (!options.includes(answer)) {
                errors.push(`Ligne ${index + 1}: La réponse correcte "${answer}" ne correspond à aucune option`);
            }
        });
        const uniqueOptions = new Set(options);
        if (uniqueOptions.size !== options.length) {
            errors.push(`Ligne ${index + 1}: Options en double détectées`);
        }
        questions.push({
            question,
            options,
            correctAnswers
        });
    });
    if (errors.length > 0) {
        throw new Error('Erreurs de format détectées:\n' + errors.join('\n'));
    }
    return questions;
}

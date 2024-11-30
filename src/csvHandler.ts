import { Question } from './question';

export function validateCSVFormat(csvData: string): Question[] {
    const lines = csvData.trim().split('\n');
    const errors: string[] = [];
    const questions: Question[] = [];

    if (lines.length < 1) {
        throw new Error('Le fichier est vide');
    }

    lines.forEach((line, index) => {
        if (!line.trim()) return;

        const parts = line.split(/(?=\S),(?=\S)/).map(part => part.trim());

        if (parts.length < 4) {
            errors.push(`Ligne ${index + 1}: Pas assez de colonnes (minimum: question, une option, réponses, url_image)`);
            return;
        }

        console.log(parts);

        const question = parts[0];
        const correctAnswersStr = parts[parts.length - 2];
        let imageUrl = parts[parts.length - 1] || null;
        if (imageUrl == "none") {
            imageUrl = null;
        }
        const options = parts.slice(1, -2);

        // Handle escaped semicolons
        const correctAnswers = correctAnswersStr.split(/(?<!\\);/).map(ans => ans.replace(/\\;/g, ';').trim());

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
            correctAnswers,
            imageUrl
        });
    });

    if (errors.length > 0) {
        throw new Error('Erreurs de format détectées:\n' + errors.join('\n'));
    }

    return questions;
}
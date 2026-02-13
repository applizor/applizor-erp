
/**
 * Evaluates payroll formulas like "Basic * 0.40" or "CTC / 12 * 0.45"
 */
export class FormulaEvaluator {
    static evaluate(formula: string, context: Record<string, number>): number {
        try {
            // 1. Replace variables with actual values
            let sanitized = formula;
            Object.entries(context).forEach(([key, value]) => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                sanitized = sanitized.replace(regex, value.toString());
            });

            // 2. Remove all non-math characters for safety
            sanitized = sanitized.replace(/[^0-9\-+\/*(). ]/g, '');

            // 3. Evaluate the safe math string
            // eslint-disable-next-line no-eval
            const result = eval(sanitized);

            return Math.floor(Number(result) || 0);
        } catch (error) {
            console.error(`Formula Evaluation Failed: ${formula}`, error);
            return 0;
        }
    }
}

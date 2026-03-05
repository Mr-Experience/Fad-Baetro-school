import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export const readCSSFile = async (filePath) => {
    try {
        const fullPath = path.resolve(process.cwd(), 'src', filePath);
        const content = await readFile(fullPath, 'utf-8');
        return content;
    } catch (error) {
        console.error('Error reading CSS file:', error);
        throw new Error(`Failed to read CSS file: ${filePath}`);
    }
};

export const updateCSSFile = async (filePath, newContent) => {
    try {
        const fullPath = path.resolve(process.cwd(), 'src', filePath);
        await writeFile(fullPath, newContent, 'utf-8');
        return true;
    } catch (error) {
        console.error('Error updating CSS file:', error);
        throw new Error(`Failed to update CSS file: ${filePath}`);
    }
};

export const getAvailableCSSFiles = () => {
    return [
        'pages/admin/AdminQuestions.css',
        'pages/admin/AdminQuestionEditor.css',
        'components/ClaudeDesignRefiner.css',
        'components/AdminLayout.css',
        'components/AdminHeader.css',
        'styles/variables.css',
        'index.css'
    ];
};
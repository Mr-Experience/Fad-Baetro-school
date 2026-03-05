import React, { useState, useEffect } from 'react';
import { refineDesignWithClaude, generateDesignFromScratch, optimizeCSS } from '../services/claudeService';
import './ClaudeDesignRefiner.css';

const ClaudeDesignRefiner = ({ currentCSS = '', onDesignUpdate, componentName = 'Component' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [refinementRequest, setRefinementRequest] = useState('Refine this design to use white backgrounds, clean borders and strokes, modern spacing, and subtle shadows. Make it look professional and clean.');
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState('refine'); // 'refine', 'generate', 'optimize'
    const [selectedFile, setSelectedFile] = useState('pages/admin/AdminQuestions.css');
    const [cssContent, setCssContent] = useState(currentCSS);
    const [availableFiles] = useState([
        'pages/admin/AdminQuestions.css',
        'pages/admin/AdminQuestionEditor.css',
        'components/ClaudeDesignRefiner.css',
        'components/AdminLayout.css',
        'components/AdminHeader.css',
        'styles/variables.css',
        'index.css'
    ]);

    useEffect(() => {
        setCssContent(currentCSS);
    }, [currentCSS]);

    const handleRefine = async () => {
        if (!refinementRequest.trim() && mode !== 'optimize') return;

        setIsProcessing(true);
        try {
            let result;
            if (mode === 'refine') {
                result = await refineDesignWithClaude(cssContent, refinementRequest);
            } else if (mode === 'generate') {
                result = await generateDesignFromScratch(refinementRequest);
            } else if (mode === 'optimize') {
                result = await optimizeCSS(cssContent);
            }

            setCssContent(result);
            if (onDesignUpdate) {
                onDesignUpdate(result, selectedFile);
            }
            alert('✅ Design refined successfully! The new CSS has been generated.');
        } catch (error) {
            alert('Failed to process design: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(cssContent);
            alert('CSS copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        }
    };

    const downloadCSS = () => {
        const blob = new Blob([cssContent], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <button
                className="claude-refine-btn"
                onClick={() => setIsOpen(true)}
                title="Refine design with Claude AI"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                AI Design
            </button>

            {isOpen && (
                <div className="claude-modal-overlay">
                    <div className="claude-modal">
                        <div className="claude-modal-header">
                            <h3>Claude AI Design Assistant</h3>
                            <button
                                className="claude-modal-close"
                                onClick={() => setIsOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="claude-modal-body">
                            <div className="claude-file-selector">
                                <label>Select CSS File:</label>
                                <select
                                    value={selectedFile}
                                    onChange={(e) => {
                                        setSelectedFile(e.target.value);
                                        loadCSSFile(e.target.value);
                                    }}
                                >
                                    {availableFiles.map(file => (
                                        <option key={file} value={file}>{file}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="claude-mode-selector">
                                <button
                                    className={`claude-mode-btn ${mode === 'refine' ? 'active' : ''}`}
                                    onClick={() => setMode('refine')}
                                >
                                    Refine Current
                                </button>
                                <button
                                    className={`claude-mode-btn ${mode === 'generate' ? 'active' : ''}`}
                                    onClick={() => setMode('generate')}
                                >
                                    Generate New
                                </button>
                                <button
                                    className={`claude-mode-btn ${mode === 'optimize' ? 'active' : ''}`}
                                    onClick={() => setMode('optimize')}
                                >
                                    Optimize
                                </button>
                            </div>

                            {mode !== 'optimize' && (
                                <div className="claude-input-group">
                                    <label>
                                        {mode === 'refine' ? 'Describe the refinements needed:' : 'Describe the design you want:'}
                                    </label>
                                    <textarea
                                        value={refinementRequest}
                                        onChange={(e) => setRefinementRequest(e.target.value)}
                                        placeholder={
                                            mode === 'refine'
                                                ? "e.g., Use white backgrounds, add subtle borders, improve spacing..."
                                                : "e.g., Create a modern card component with white background and clean borders..."
                                        }
                                        rows={4}
                                    />
                                </div>
                            )}

                            <div className="claude-preview">
                                <h4>CSS Content ({selectedFile}):</h4>
                                <div className="claude-preview-actions">
                                    <button onClick={copyToClipboard} className="claude-preview-btn">
                                        📋 Copy
                                    </button>
                                    <button onClick={downloadCSS} className="claude-preview-btn">
                                        💾 Download
                                    </button>
                                </div>
                                <pre className="claude-css-preview">
                                    {cssContent}
                                </pre>
                            </div>
                        </div>

                        <div className="claude-modal-footer">
                            <button
                                className="claude-btn claude-btn-cancel"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="claude-btn claude-btn-primary"
                                onClick={handleRefine}
                                disabled={isProcessing || (mode !== 'optimize' && !refinementRequest.trim())}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="claude-spinner"></div>
                                        Processing...
                                    </>
                                ) : (
                                    mode === 'refine' ? 'Refine Design' :
                                    mode === 'generate' ? 'Generate Design' : 'Optimize CSS'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ClaudeDesignRefiner;
import React, { useState } from 'react';

const questions = [
    {
        question: 'Wie viele Spieler hat eine Fußballmannschaft auf dem Feld?',
        options: ['9', '10', '11', '12'],
        correctAnswer: '11',
    },
    {
        question: 'Was ist die maximale Anzahl an Auswechslungen in einem offiziellen Spiel?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '5',
    },
    {
        question: 'Welches Land hat die meisten Fußball-Weltmeisterschaften gewonnen?',
        options: ['Deutschland', 'Argentinien', 'Brasilien', 'Italien'],
        correctAnswer: 'Brasilien',
    },
    {
        question: 'Wie lange dauert ein normales Fußballspiel ohne Verlängerung?',
        options: ['80 Minuten', '90 Minuten', '100 Minuten', '120 Minuten'],
        correctAnswer: '90 Minuten',
    },
    {
        question: 'Welcher Spieler ist als \'CR7\' bekannt?',
        options: ['Lionel Messi', 'Neymar Jr.', 'Kylian Mbappé', 'Cristiano Ronaldo'],
        correctAnswer: 'Cristiano Ronaldo',
    },
];

interface QuizProps {
    onComplete: (correct: boolean) => void;
}

const Quiz: React.FC<QuizProps> = ({ onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const handleAnswer = (answer: string) => {
        if (questions[currentQuestionIndex].correctAnswer === answer) {
            setScore(score + 1);
        }

        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < questions.length) {
            setCurrentQuestionIndex(nextQuestionIndex);
        } else {
            setQuizFinished(true);
        }
    };

    if (quizFinished) {
        return (
            <div className="p-6 bg-gray-800 rounded-lg max-w-md mx-auto mt-10 text-white text-center">
                <h2 className="text-2xl font-bold mb-4">Quiz beendet!</h2>
                <p className="text-lg mb-6">Dein Ergebnis: {score} von {questions.length} richtigen Antworten</p>
                <button 
                    onClick={() => onComplete(score > 0)}
                    className="py-3 px-6 rounded-xl font-bold uppercase text-sm transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                >
                    Schließen
                </button>
            </div>
        );
    }

    const question = questions[currentQuestionIndex];

    return (
        <div className="p-6 bg-gray-800 rounded-lg max-w-md mx-auto mt-10 text-white">
            <div className="mb-4">
                <p className="text-sm text-gray-400">Frage {currentQuestionIndex + 1} von {questions.length}</p>
                <h3 className="text-xl font-bold text-center">{question.question}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {question.options.map((option) => (
                    <button 
                        key={option} 
                        onClick={() => handleAnswer(option)}
                        className="py-3 px-4 rounded-xl font-bold uppercase text-sm transition-all bg-slate-700 text-white hover:bg-blue-600 shadow-md"
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Quiz;

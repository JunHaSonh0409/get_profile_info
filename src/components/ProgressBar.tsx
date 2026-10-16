'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

export default function ProgressBar({ currentStep, totalSteps, stepTitle }: ProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-step-text">
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ff4370' }} />
          STEP {currentStep} / {totalSteps} · {stepTitle}
        </span>
        <span className="progress-percent-text">{percentage}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

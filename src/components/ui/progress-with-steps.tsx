import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

interface ProgressWithStepsProps {
  steps: ProgressStep[];
  currentStep: string;
  progress: number;
  isComplete?: boolean;
}

export const ProgressWithSteps = ({ steps, currentStep, progress, isComplete }: ProgressWithStepsProps) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Generation Progress</span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCurrentStep = step.id === currentStep;
          const isCompleted = index < currentStepIndex || isComplete;
          const isPending = index > currentStepIndex && !isComplete;
          
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                isCurrentStep 
                  ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' 
                  : isCompleted 
                    ? 'bg-green-50 dark:bg-green-950/20' 
                    : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isCurrentStep ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  isCurrentStep 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : isCompleted 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {step.label}
                </div>
                {step.description && (
                  <div className={`text-sm mt-1 ${
                    isCurrentStep 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : isCompleted 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { Check } from "lucide-react";

export default function StepNumber({ currentStep , steps }: {currentStep:number , steps} ){
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;

        return (
          <div key={index} className="flex items-center">
          
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                isDone
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}>
              
        {isDone ? <Check className="h-5 w-5" /> : stepNumber}
            </div>
          </div>
        );
      })}
    </div>
  );
}
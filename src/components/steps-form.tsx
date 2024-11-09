"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type StepsFormContextType = {
	value: number;
	setValue: (value: number) => void;
	totalSteps: number;
};
const StepsFormContext = React.createContext<StepsFormContextType | undefined>(undefined);

const Steps = React.forwardRef<
	React.ElementRef<typeof Tabs>,
	React.ComponentPropsWithoutRef<typeof Tabs> & { totalSteps: number }
>(({ totalSteps, value: v, onValueChange, defaultValue, ...props }, ref) => {
	const [value, setValue] = React.useState<number>(Number(defaultValue ?? "0"));

	return (
		<StepsFormContext.Provider value={{ value, setValue, totalSteps }}>
			<Tabs
				ref={ref}
				value={`${value}`}
				onValueChange={(val) => setValue(Number(val))}
				{...props}
			/>
		</StepsFormContext.Provider>
	);
});
Steps.displayName = "Steps";

const StepsList = React.forwardRef<
	React.ElementRef<typeof TabsList>,
	React.ComponentPropsWithoutRef<typeof TabsList>
>(({ ...props }, ref) => <TabsList ref={ref} {...props} />);
StepsList.displayName = "StepsList";

const StepsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsTrigger>,
	React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ value, ...props }, ref) => {
	const context = React.useContext(StepsFormContext);
	if (!context) throw new Error("StepsFormTrigger must be used within a StepsFormProvider");
	const { value: currentValue } = context;

	return (
		<TabsTrigger ref={ref} value={value} disabled={Number(value) != currentValue} {...props} />
	);
});
StepsTrigger.displayName = "StepsTrigger";

const StepsContent = React.forwardRef<
	React.ElementRef<typeof TabsContent>,
	React.ComponentPropsWithoutRef<typeof TabsContent>
>(({ ...props }, ref) => <TabsContent ref={ref} {...props} />);
StepsContent.displayName = "StepsContent";

const StepsProgress = React.forwardRef<
	React.ElementRef<typeof Progress>,
	React.ComponentPropsWithoutRef<typeof Progress>
>(({ ...props }, ref) => {
	const context = React.useContext(StepsFormContext);
	if (!context) throw new Error("StepsFormTrigger must be used within a StepsFormProvider");
	const { value: currentValue, totalSteps } = context;

	return <Progress ref={ref} value={((currentValue + 1) / totalSteps) * 100} {...props} />;
});

StepsProgress.displayName = "StepsProgress";

const StepsNext = React.forwardRef<
	React.ElementRef<typeof Button>,
	React.ComponentPropsWithoutRef<typeof Button>
>(({ ...props }, ref) => {
	const context = React.useContext(StepsFormContext);
	if (!context) throw new Error("StepsFormTrigger must be used within a StepsFormProvider");
	const { value, setValue, totalSteps } = context;

	return (
		<Button
			ref={ref}
			onClick={() => setValue(value + 1)}
			disabled={value >= totalSteps - 1}
			{...props}
		/>
	);
});

StepsNext.displayName = "StepsNext";

const StepsPrevious = React.forwardRef<
	React.ElementRef<typeof Button>,
	React.ComponentPropsWithoutRef<typeof Button>
>(({ ...props }, ref) => {
	const context = React.useContext(StepsFormContext);
	if (!context) throw new Error("StepsFormTrigger must be used within a StepsFormProvider");
	const { value, setValue, totalSteps } = context;

	return (
		<Button
			ref={ref}
			variant="outline"
			disabled={value === 0}
			onClick={() => setValue(value - 1)}
			{...props}
		/>
	);
});

StepsPrevious.displayName = "StepsPrevious";

export { Steps, StepsList, StepsTrigger, StepsContent, StepsProgress, StepsNext, StepsPrevious };

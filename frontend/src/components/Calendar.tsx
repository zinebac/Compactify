"use client"

import * as React from "react"
import { ChevronDownIcon, Calendar as Cal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar as Calen } from "@/components/ui/calendar"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

export const Calendar: React.FC<{
	setExpiresAt: React.Dispatch<React.SetStateAction<string>>,
	expiresAt: string,
}> = ({
	setExpiresAt,
	expiresAt,
}) => {
	const [open, setOpen] = React.useState(false)

	// Get today's date and set time to start of day for accurate comparison
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Get current year and calculate year range
	const currentYear = new Date().getFullYear()
	const maxYear = currentYear + 10

	// Set month range - start from current month of current year
	const fromMonth = new Date(currentYear, new Date().getMonth())

	// Disable past dates
	const disablePastDates = (date: Date) => {
		return date < today
	}

	return (
		<div className="flex gap-4">
			<div className="flex flex-col gap-3">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							id="date-picker"
							className="justify-between font-normal"
						>
							<Cal size={16} className="text-gray-400" />
							{expiresAt ? expiresAt : "Select date"}
							<ChevronDownIcon />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto overflow-hidden p-0" align="start">
						<Calen
							mode="single"
							selected={new Date(expiresAt)}
							captionLayout="dropdown"
							fromYear={currentYear}
							toYear={maxYear}
							fromMonth={fromMonth}
							disabled={disablePastDates}
							onSelect={(date) => {
								setExpiresAt(date ? date.toISOString().split("T")[0] : "")
								setOpen(false)
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
			{/* <div className="flex flex-col gap-3">
				<Label htmlFor="time-picker" className="px-1">
					Time
				</Label>
				<Input
					type="time"
					id="time-picker"
					step="1"
					defaultValue="10:30:00"
					className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			</div> */}
		</div>
	)
}
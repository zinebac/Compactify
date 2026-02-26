import * as React from "react"
import { ChevronDownIcon, Calendar as Cal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar as Calen } from "@/components/ui/calendar"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarPickerProps {
	/** ISO date string (YYYY-MM-DD) currently selected, or empty string for none. */
	expiresAt: string;
	/** Setter from the parent's `useState` — called with the new ISO date string. */
	setExpiresAt: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Date-picker popover used for selecting a URL expiry date.
 *
 * Only future dates are selectable; the picker is capped 10 years ahead.
 * Selecting a date closes the popover automatically.
 */
export const Calendar: React.FC<CalendarPickerProps> = ({
	setExpiresAt,
	expiresAt,
}) => {
	const [open, setOpen] = React.useState(false)

	// Midnight today — used to disable past dates in the picker
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const now = new Date()
	// Navigation starts at the current month and ends 10 years ahead
	const startMonth = new Date(now.getFullYear(), now.getMonth())
	const endMonth = new Date(now.getFullYear() + 10, 11) // December of +10 years

	const disablePastDates = (date: Date) => date < today

	return (
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
					selected={expiresAt ? new Date(expiresAt) : undefined}
					captionLayout="dropdown"
					startMonth={startMonth}
					endMonth={endMonth}
					disabled={disablePastDates}
					onSelect={(date) => {
						setExpiresAt(date ? date.toISOString().split("T")[0] : "")
						setOpen(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}

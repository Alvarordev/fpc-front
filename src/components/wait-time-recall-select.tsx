import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  WAIT_TIME_RECALL_OPTIONS,
  type WaitTimeRecall,
} from "@/types/wait-time-recall"

interface WaitTimeRecallSelectProps {
  value: WaitTimeRecall
  onValueChange: (value: WaitTimeRecall) => void
  triggerClassName?: string
}

export function WaitTimeRecallSelect({
  value,
  onValueChange,
  triggerClassName,
}: WaitTimeRecallSelectProps) {
  return (
    <Select
      items={WAIT_TIME_RECALL_OPTIONS}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as WaitTimeRecall)
      }}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Seleccionar..." />
      </SelectTrigger>
      <SelectContent>
        {WAIT_TIME_RECALL_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

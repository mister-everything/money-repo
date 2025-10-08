import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  includeTime?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "날짜를 선택하세요",
  includeTime = false,
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date
  );
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    date || new Date()
  );
  const [time, setTime] = React.useState({
    hours: date ? date.getHours().toString().padStart(2, "0") : "00",
    minutes: date ? date.getMinutes().toString().padStart(2, "0") : "00",
  });

  // 년도 옵션 생성 (현재 년도 기준 ±10년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 21 },
    (_, i) => currentYear - 10 + i
  );

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}월`,
  }));

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setCurrentMonth(date);
      setTime({
        hours: date.getHours().toString().padStart(2, "0"),
        minutes: date.getMinutes().toString().padStart(2, "0"),
      });
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      if (includeTime) {
        const updatedDate = new Date(newDate);
        updatedDate.setHours(parseInt(time.hours));
        updatedDate.setMinutes(parseInt(time.minutes));
        setSelectedDate(updatedDate);
        onDateChange?.(updatedDate);
      } else {
        setSelectedDate(newDate);
        onDateChange?.(newDate);
        setOpen(false);
      }
    } else {
      setSelectedDate(undefined);
      onDateChange?.(undefined);
    }
  };

  const handleTimeChange = (field: "hours" | "minutes", value: string) => {
    const newTime = { ...time, [field]: value };
    setTime(newTime);

    if (selectedDate) {
      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(parseInt(newTime.hours));
      updatedDate.setMinutes(parseInt(newTime.minutes));
      setSelectedDate(updatedDate);
      onDateChange?.(updatedDate);
    }
  };

  const handleApply = () => {
    if (selectedDate && includeTime) {
      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(parseInt(time.hours));
      updatedDate.setMinutes(parseInt(time.minutes));
      setSelectedDate(updatedDate);
      onDateChange?.(updatedDate);
    }
    setOpen(false);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(month));
    setCurrentMonth(newDate);
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return "";
    if (includeTime) {
      return format(selectedDate, "yyyy-MM-dd HH:mm");
    }
    return format(selectedDate, "yyyy-MM-dd");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? formatDisplayValue() : placeholder}
          {includeTime && <Clock className="ml-auto h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <Select
              value={currentMonth.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          {includeTime && (
            <div className="border-t pt-3 mt-3">
              <Label className="text-sm font-medium mb-2 block">
                시간 설정
              </Label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={time.hours}
                    onChange={(e) => handleTimeChange("hours", e.target.value)}
                    className="w-16 text-center"
                    placeholder="00"
                  />
                  <span className="text-sm text-muted-foreground">시</span>
                </div>
                <span className="text-muted-foreground">:</span>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={time.minutes}
                    onChange={(e) =>
                      handleTimeChange("minutes", e.target.value)
                    }
                    className="w-16 text-center"
                    placeholder="00"
                  />
                  <span className="text-sm text-muted-foreground">분</span>
                </div>
              </div>
              <Button onClick={handleApply} className="w-full mt-3" size="sm">
                적용
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

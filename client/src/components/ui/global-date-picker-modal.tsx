import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { TimezoneUtils } from "@shared/utils/timezone";

interface GlobalDatePickerModalProps {
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function GlobalDatePickerModal({ 
  showDatePicker,
  setShowDatePicker,
  selectedDate, 
  onDateChange
}: GlobalDatePickerModalProps) {
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
  
  // Refs for scrolling to current date
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  // Update temp date when selectedDate prop changes
  useEffect(() => {
    setTempSelectedDate(selectedDate);
  }, [selectedDate]);

  // Parse current date
  const currentDate = TimezoneUtils.parseUserDate(tempSelectedDate);
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate date options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Scroll to center current date when picker opens
  useEffect(() => {
    if (showDatePicker) {
      const scrollToCenter = (container: HTMLElement, targetIndex: number) => {
        if (!container || targetIndex < 0) return;
        
        const wheel = container.querySelector('.date-picker-wheel') as HTMLElement;
        if (!wheel) return;
        
        const buttons = wheel.querySelectorAll('button');
        const targetButton = buttons[targetIndex] as HTMLElement;
        if (!targetButton) return;

        // Use scrollIntoView with precise centering
        targetButton.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      };

      // Multiple attempts with increasing delays to ensure DOM is ready
      const attemptCentering = (attempt = 0) => {
        if (attempt > 3) return; // Max 4 attempts
        
        setTimeout(() => {
          if (dayScrollRef.current) {
            scrollToCenter(dayScrollRef.current, currentDay - 1);
          }
          if (monthScrollRef.current) {
            scrollToCenter(monthScrollRef.current, currentMonth);
          }
          if (yearScrollRef.current) {
            const yearIndex = years.findIndex(y => y === currentYear);
            if (yearIndex >= 0) {
              scrollToCenter(yearScrollRef.current, yearIndex);
            }
          }
        }, attempt * 200); // Increasing delay: 0ms, 200ms, 400ms, 600ms
      };

      attemptCentering(0);
    }
  }, [showDatePicker, currentDay, currentMonth, currentYear, years]);

  const handleDateChange = (day: number, month: number, year: number) => {
    try {
      // Validate the date
      const newDate = new Date(year, month, day);
      if (newDate.getDate() !== day || newDate.getMonth() !== month || newDate.getFullYear() !== year) {
        return; // Invalid date, don't update
      }
      
      const newDateString = TimezoneUtils.formatDateForStorage(newDate);
      setTempSelectedDate(newDateString);
    } catch (error) {
      console.error('Error creating date:', error);
    }
  };

  const handleConfirm = () => {
    onDateChange(tempSelectedDate);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate);
    setShowDatePicker(false);
  };

  const handlePreviousDay = () => {
    const currentDate = TimezoneUtils.parseUserDate(tempSelectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    const newDateString = TimezoneUtils.formatDateForStorage(newDate);
    setTempSelectedDate(newDateString);
  };

  const handleNextDay = () => {
    const currentDate = TimezoneUtils.parseUserDate(tempSelectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    const newDateString = TimezoneUtils.formatDateForStorage(newDate);
    setTempSelectedDate(newDateString);
  };

  const handleTodaySelect = () => {
    const today = new Date();
    const todayString = TimezoneUtils.formatDateForStorage(today);
    setTempSelectedDate(todayString);
  };

  if (!showDatePicker) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center modal-overlay-enter ios-animation"
      style={{ touchAction: 'none' }} // Prevent background scrolling
    >
      <div className="bg-background w-full max-w-md mx-4 mb-4 rounded-t-2xl shadow-2xl modal-content-enter ios-smooth-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={handleCancel}
            className="ios-touch-feedback p-2 text-foreground/60 hover:text-foreground touch-target"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-foreground">Change Date</h3>
          <button
            onClick={handleConfirm}
            className="ios-touch-feedback p-2 text-blue-500 hover:text-blue-600 touch-target"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>

        {/* Top Compact Date Selector */}
        <div className="flex items-center justify-center py-2 border-b border-border">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePreviousDay}
              className="ios-touch-feedback p-1 text-foreground/60 hover:text-foreground transition-colors rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            
            <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-accent/20">
              <span className="text-sm font-medium text-foreground">
                {TimezoneUtils.isToday(tempSelectedDate) ? 'Today' : 
                 TimezoneUtils.parseUserDate(tempSelectedDate).toLocaleDateString('en-GB', { 
                   day: '2-digit', 
                   month: '2-digit',
                   year: 'numeric'
                 })}
              </span>
            </div>
            
            <button
              onClick={handleNextDay}
              className="ios-touch-feedback p-1 text-foreground/60 hover:text-foreground transition-colors rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Today Button */}
        <div className="p-4 text-center border-b border-border">
          <button
            onClick={handleTodaySelect}
            className="text-blue-500 font-medium text-lg hover:text-blue-600 transition-colors touch-target"
          >
            Today
          </button>
        </div>

        {/* Date Picker Wheels */}
        <div className="px-4 py-6 overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
          <div className="grid grid-cols-3 gap-2 text-center relative max-w-full">
            
            {/* Days */}
            <div ref={dayScrollRef} className="flex flex-col items-center min-w-0">
              <div className="text-foreground/60 text-xs font-medium text-center mb-2">Day</div>
              <div className="max-h-40 overflow-y-auto space-y-1 date-picker-wheel py-12 w-full" style={{ touchAction: 'pan-y' }}>
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDateChange(day, currentMonth, currentYear)}
                    className={`w-full text-base py-2 px-1 rounded-lg transition-colors touch-target min-h-[44px] flex items-center justify-center ${
                      day === currentDay 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Months */}
            <div ref={monthScrollRef} className="flex flex-col items-center min-w-0">
              <div className="text-foreground/60 text-xs font-medium text-center mb-2">Month</div>
              <div className="max-h-40 overflow-y-auto space-y-1 date-picker-wheel py-12 w-full" style={{ touchAction: 'pan-y' }}>
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleDateChange(currentDay, index, currentYear)}
                    className={`w-full text-sm py-2 px-1 rounded-lg transition-colors touch-target min-h-[44px] flex items-center justify-center truncate ${
                      index === currentMonth 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    }`}
                    title={month}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Years */}
            <div ref={yearScrollRef} className="flex flex-col items-center min-w-0">
              <div className="text-foreground/60 text-xs font-medium text-center mb-2">Year</div>
              <div className="max-h-40 overflow-y-auto space-y-1 date-picker-wheel py-12 w-full" style={{ touchAction: 'pan-y' }}>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleDateChange(currentDay, currentMonth, year)}
                    className={`w-full text-base py-2 px-1 rounded-lg transition-colors touch-target min-h-[44px] flex items-center justify-center ${
                      year === currentYear 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-16 h-1 bg-foreground/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
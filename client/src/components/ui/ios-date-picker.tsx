import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X, Check } from "lucide-react";
import { TimezoneUtils } from "@shared/utils/timezone";

interface IOSDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDatePicker?: boolean;
  setShowDatePicker?: (show: boolean) => void;
}

export function IOSDatePicker({ 
  selectedDate, 
  onDateChange, 
  size = 'md',
  className = "",
  showDatePicker: externalShowDatePicker,
  setShowDatePicker: externalSetShowDatePicker
}: IOSDatePickerProps) {
  const [internalShowDatePicker, setInternalShowDatePicker] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const showDatePicker = externalShowDatePicker !== undefined ? externalShowDatePicker : internalShowDatePicker;
  const setShowDatePicker = externalSetShowDatePicker || setInternalShowDatePicker;
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
        if (attempt > 3) return; // Give up after 4 attempts
        
        const delay = attempt === 0 ? 100 : attempt * 150;
        
        setTimeout(() => {
          try {
            if (dayScrollRef.current) scrollToCenter(dayScrollRef.current, currentDay - 1);
            if (monthScrollRef.current) scrollToCenter(monthScrollRef.current, currentMonth);
            if (yearScrollRef.current) {
              const yearIndex = years.indexOf(currentYear);
              scrollToCenter(yearScrollRef.current, yearIndex);
            }
          } catch (error) {
            // If centering fails, try again with a longer delay
            attemptCentering(attempt + 1);
          }
        }, delay);
      };

      attemptCentering();
    }
  }, [showDatePicker, currentDay, currentMonth, currentYear, years]);

  const handleDateChange = (day: number, month: number, year: number) => {
    try {
      const newDate = new Date(year, month, day);
      if (newDate.getMonth() === month) { // Valid date
        setTempSelectedDate(TimezoneUtils.formatDateForStorage(newDate));
      }
    } catch (error) {
      console.warn('Invalid date:', { day, month, year });
    }
  };

  const handleConfirm = () => {
    onDateChange(tempSelectedDate);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate); // Reset to original
    setShowDatePicker(false);
  };

  const sizeClasses = {
    sm: {
      container: "gap-2",
      button: "p-1 text-sm",
      arrow: "h-4 w-4",
      text: "text-sm",
      datePicker: "px-2 py-1"
    },
    md: {
      container: "gap-4",
      button: "p-1.5",
      arrow: "h-5 w-5",
      text: "text-lg",
      datePicker: "px-3 py-1.5"
    },
    lg: {
      container: "gap-6",
      button: "p-2",
      arrow: "h-6 w-6",
      text: "text-xl",
      datePicker: "px-4 py-2"
    }
  };

  const classes = sizeClasses[size];

  const handlePreviousDay = () => {
    onDateChange(TimezoneUtils.addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(TimezoneUtils.addDays(selectedDate, 1));
  };

  const handleTodaySelect = () => {
    const today = TimezoneUtils.getCurrentDate();
    setTempSelectedDate(today);
    onDateChange(today);
    setShowDatePicker(false);
  };

  return (
    <>
      {/* Compact Date Selector */}
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className={`flex items-center ${classes.container}`}>
          <button
            onClick={handlePreviousDay}
            className={`ios-touch-feedback ${classes.button} text-foreground/60 hover:text-foreground transition-colors`}
          >
            <ChevronLeft className={classes.arrow} />
          </button>
          
          <button
            onClick={() => setShowDatePicker(true)}
            className={`ios-touch-feedback flex items-center gap-1.5 ${classes.datePicker} rounded-lg hover:bg-accent/50 transition-colors`}
          >
            <span className={`${classes.text} font-medium text-foreground`}>
              {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
               TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                 day: '2-digit', 
                 month: '2-digit'
               })}
            </span>
            <ChevronDown className="h-4 w-4 text-foreground/50" />
          </button>
          
          <button
            onClick={handleNextDay}
            className={`ios-touch-feedback ${classes.button} text-foreground/60 hover:text-foreground transition-colors`}
          >
            <ChevronRight className={classes.arrow} />
          </button>
        </div>
      </div>

      {/* iOS-Style Date Picker Modal */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          style={{ touchAction: 'none' }} // Prevent background scrolling
        >
          <div className="bg-background w-full max-w-md mx-4 mb-4 rounded-t-2xl shadow-2xl">
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
      )}
    </>
  );
}
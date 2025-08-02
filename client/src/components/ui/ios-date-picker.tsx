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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDatePicker) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Simple overflow hidden approach - less aggressive
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [showDatePicker]);

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
      {/* Compact Date Selector - Top Position (Hidden) */}
      <div className="hidden flex items-center justify-center py-1">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePreviousDay}
            className="ios-touch-feedback p-1 text-foreground/60 hover:text-foreground transition-colors  min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          
          <button
            onClick={() => setShowDatePicker(true)}
            className="ios-touch-feedback flex items-center gap-1 px-2 py-1  hover:bg-accent/50 transition-colors"
          >
            <span className="text-xs font-medium text-foreground">
              {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
               TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                 day: '2-digit', 
                 month: '2-digit'
               })}
            </span>
            <ChevronDown className="h-3 w-3 text-foreground/50" />
          </button>
          
          <button
            onClick={handleNextDay}
            className="ios-touch-feedback p-1 text-foreground/60 hover:text-foreground transition-colors  min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* iOS-Style Date Picker Modal */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center modal-overlay-enter ios-animation"
          style={{ touchAction: 'none' }} // Prevent background scrolling
        >
          <div className="bg-background w-full max-w-md mx-4 mb-4  shadow-2xl modal-content-enter ios-smooth-transform">
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
            <div className="relative flex items-center justify-center py-2 border-b border-border">
              {/* Navigation Controls - Centered */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePreviousDay}
                  className="ios-touch-feedback p-1 text-foreground/60 hover:text-foreground transition-colors  min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                
                <div className="flex items-center gap-1 px-3 py-1  bg-accent/20">
                  <span className="text-sm font-medium text-foreground">
                    {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                     TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                       day: '2-digit', 
                       month: '2-digit',
                       year: 'numeric'
                     })}
                  </span>
                </div>
                
                <button
                  onClick={handleNextDay}
                  className="ios-touch-feedback p-1 text-foreground/60 hover:text-foreground transition-colors  min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              
              {/* Today Button - Positioned far right */}
              {!TimezoneUtils.isToday(selectedDate) && (
                <button
                  onClick={() => {
                    const today = TimezoneUtils.getCurrentDate();
                    onDateChange(today);
                  }}
                  className="absolute right-2 ios-touch-feedback text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors px-2 py-1  min-h-[28px] touch-target"
                >
                  Today
                </button>
              )}
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
                        className={`w-full text-base py-2 px-1  transition-colors touch-target min-h-[44px] flex items-center justify-center ${
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
                        className={`w-full text-sm py-2 px-1  transition-colors touch-target min-h-[44px] flex items-center justify-center truncate ${
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
                        className={`w-full text-base py-2 px-1  transition-colors touch-target min-h-[44px] flex items-center justify-center ${
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
              <div className="w-16 h-1 bg-foreground/20 "></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
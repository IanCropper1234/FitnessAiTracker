import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X, Check } from "lucide-react";
import { TimezoneUtils } from "@shared/utils/timezone";

interface IOSDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IOSDatePicker({ 
  selectedDate, 
  onDateChange, 
  size = 'md',
  className = ""
}: IOSDatePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
  
  // Refs for auto-scrolling to selected items
  const dayWheelRef = useRef<HTMLDivElement>(null);
  const monthWheelRef = useRef<HTMLDivElement>(null);
  const yearWheelRef = useRef<HTMLDivElement>(null);

  // Update temp date when selectedDate prop changes
  useEffect(() => {
    setTempSelectedDate(selectedDate);
  }, [selectedDate]);

  // Parse current date
  const currentDate = TimezoneUtils.parseUserDate(tempSelectedDate);
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate date options with proper days for current month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);
  const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  // Auto-scroll to selected item in wheel
  const scrollToSelected = (containerRef: React.RefObject<HTMLDivElement>, selectedIndex: number) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const items = container.children;
      if (items[selectedIndex]) {
        const item = items[selectedIndex] as HTMLElement;
        const containerHeight = container.clientHeight;
        const itemHeight = item.clientHeight;
        const scrollTop = item.offsetTop - (containerHeight / 2) + (itemHeight / 2);
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  };

  // Effect to auto-scroll when picker opens
  useEffect(() => {
    if (showDatePicker) {
      setTimeout(() => {
        scrollToSelected(dayWheelRef, currentDay - 1);
        scrollToSelected(monthWheelRef, currentMonth);
        scrollToSelected(yearWheelRef, years.indexOf(currentYear));
      }, 100);
    }
  }, [showDatePicker, currentDay, currentMonth, currentYear, years]);

  const handleDateChange = (day: number, month: number, year: number) => {
    try {
      // Ensure day is valid for the selected month/year
      const maxDays = getDaysInMonth(month, year);
      const validDay = Math.min(day, maxDays);
      
      const newDate = new Date(year, month, validDay);
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

  // When opening the picker, if no date is selected or it's not today, default to today
  const handleOpenPicker = () => {
    const today = TimezoneUtils.getCurrentDate();
    if (!selectedDate || selectedDate === '') {
      setTempSelectedDate(today);
    } else {
      setTempSelectedDate(selectedDate);
    }
    setShowDatePicker(true);
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
            onClick={handleOpenPicker}
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
          className="fixed inset-0 z-[9999] bg-black/50 animate-fade-in"
          style={{ 
            touchAction: 'none'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl animate-slide-up">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-foreground/20 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <button
                onClick={handleCancel}
                className="ios-touch-feedback text-blue-500 font-medium text-lg hover:text-blue-600 transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-lg font-semibold text-foreground">Select Date</h3>
              <button
                onClick={handleConfirm}
                className="ios-touch-feedback text-blue-500 font-medium text-lg hover:text-blue-600 transition-colors"
              >
                Done
              </button>
            </div>

            {/* Today Button */}
            <div className="px-6 py-4 text-center border-b border-border/50">
              <button
                onClick={handleTodaySelect}
                className="text-blue-500 font-medium text-base hover:text-blue-600 transition-colors ios-touch-feedback"
              >
                Today
              </button>
            </div>

            {/* Date Picker Wheels */}
            <div className="relative px-6 py-8">
              {/* Selection Indicator */}
              <div className="absolute inset-x-6 top-1/2 transform -translate-y-1/2 h-12 bg-accent/30 rounded-lg border border-border/30 pointer-events-none z-10"></div>
              
              <div className="grid grid-cols-3 gap-4 h-48">
                {/* Days Wheel */}
                <div className="relative">
                  <div className="text-foreground/60 text-sm font-medium text-center mb-2">Day</div>
                  <div 
                    ref={dayWheelRef}
                    className="h-40 overflow-y-auto scrollbar-hide date-picker-wheel"
                    style={{ 
                      touchAction: 'pan-y',
                      scrollSnapType: 'y mandatory'
                    }}
                  >
                    <div className="py-16">
                      {days.map((day) => (
                        <div
                          key={day}
                          onClick={() => handleDateChange(day, currentMonth, currentYear)}
                          className={`h-12 flex items-center justify-center text-lg font-medium cursor-pointer transition-all duration-200 ${
                            day === currentDay 
                              ? 'text-foreground scale-110' 
                              : 'text-foreground/50 hover:text-foreground/80'
                          }`}
                          style={{ scrollSnapAlign: 'center' }}
                        >
                          {day.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Months Wheel */}
                <div className="relative">
                  <div className="text-foreground/60 text-sm font-medium text-center mb-2">Month</div>
                  <div 
                    ref={monthWheelRef}
                    className="h-40 overflow-y-auto scrollbar-hide date-picker-wheel"
                    style={{ 
                      touchAction: 'pan-y',
                      scrollSnapType: 'y mandatory'
                    }}
                  >
                    <div className="py-16">
                      {months.map((month, index) => (
                        <div
                          key={month}
                          onClick={() => handleDateChange(currentDay, index, currentYear)}
                          className={`h-12 flex items-center justify-center text-lg font-medium cursor-pointer transition-all duration-200 ${
                            index === currentMonth 
                              ? 'text-foreground scale-110' 
                              : 'text-foreground/50 hover:text-foreground/80'
                          }`}
                          style={{ scrollSnapAlign: 'center' }}
                        >
                          {month}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Years Wheel */}
                <div className="relative">
                  <div className="text-foreground/60 text-sm font-medium text-center mb-2">Year</div>
                  <div 
                    ref={yearWheelRef}
                    className="h-40 overflow-y-auto scrollbar-hide date-picker-wheel"
                    style={{ 
                      touchAction: 'pan-y',
                      scrollSnapType: 'y mandatory'
                    }}
                  >
                    <div className="py-16">
                      {years.map((year) => (
                        <div
                          key={year}
                          onClick={() => handleDateChange(currentDay, currentMonth, year)}
                          className={`h-12 flex items-center justify-center text-lg font-medium cursor-pointer transition-all duration-200 ${
                            year === currentYear 
                              ? 'text-foreground scale-110' 
                              : 'text-foreground/50 hover:text-foreground/80'
                          }`}
                          style={{ scrollSnapAlign: 'center' }}
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safe Area Bottom Padding */}
            <div className="h-8 sm:h-4"></div>
          </div>
        </div>
      )}
    </>
  );
}
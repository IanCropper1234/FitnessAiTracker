import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IOSDateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

interface DateWheel {
  day: number;
  month: number;
  year: number;
}

export function IOSDateSelector({ selectedDate, onDateChange, className = "" }: IOSDateSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Parse current date
  const currentDate = new Date(selectedDate);
  const today = new Date();
  
  // Check if selected date is today
  const isToday = selectedDate === today.toISOString().split('T')[0];
  
  // Format display text
  const formatDisplayDate = (date: Date) => {
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit'
    });
  };
  
  // Generate date options for wheels
  const generateDateWheels = (centerDate: Date): DateWheel => {
    return {
      day: centerDate.getDate(),
      month: centerDate.getMonth() + 1,
      year: centerDate.getFullYear()
    };
  };
  
  const [dateWheels, setDateWheels] = useState<DateWheel>(generateDateWheels(currentDate));
  const dayWheelRef = useRef<HTMLDivElement>(null);
  const monthWheelRef = useRef<HTMLDivElement>(null);
  const yearWheelRef = useRef<HTMLDivElement>(null);
  
  // Generate full day options for scrolling
  const generateDayOptions = (month: number, year: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const options = [];
    for (let i = 1; i <= daysInMonth; i++) {
      options.push(i);
    }
    return options;
  };
  
  // Generate month options
  const generateMonthOptions = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({ value: index + 1, label: month }));
  };
  
  // Generate year options
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };
  
  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate.toISOString().split('T')[0]);
  };
  
  // Handle wheel selection
  const handleDateWheelChange = (type: 'day' | 'month' | 'year', value: number) => {
    const newWheels = { ...dateWheels, [type]: value };
    setDateWheels(newWheels);
    
    // Create new date
    const newDate = new Date(newWheels.year, newWheels.month - 1, newWheels.day);
    onDateChange(newDate.toISOString().split('T')[0]);
  };
  
  const dayOptions = generateDayOptions(dateWheels.month, dateWheels.year);
  const monthOptions = generateMonthOptions();
  const yearOptions = generateYearOptions();
  
  // Handle scroll events and prevent background scroll
  useEffect(() => {
    if (showDatePicker) {
      document.body.style.overflow = 'hidden';
      
      // Center the current selected values in each wheel
      const centerSelectedValues = () => {
        const centerOption = (container: HTMLDivElement | null, selectedIndex: number) => {
          if (container) {
            const itemHeight = 40; // Each item is h-10 (40px)
            const containerHeight = 160; // h-40 (160px)
            const scrollTop = selectedIndex * itemHeight - (containerHeight / 2) + (itemHeight / 2);
            container.scrollTop = Math.max(0, scrollTop);
          }
        };

        if (dayWheelRef.current) {
          const selectedDayIndex = dayOptions.findIndex(day => day === dateWheels.day);
          centerOption(dayWheelRef.current, selectedDayIndex);
        }
        
        if (monthWheelRef.current) {
          const selectedMonthIndex = monthOptions.findIndex(month => month.value === dateWheels.month);
          centerOption(monthWheelRef.current, selectedMonthIndex);
        }
        
        if (yearWheelRef.current) {
          const selectedYearIndex = yearOptions.findIndex(year => year === dateWheels.year);
          centerOption(yearWheelRef.current, selectedYearIndex);
        }
      };

      // Center values on open
      setTimeout(centerSelectedValues, 100);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDatePicker, dateWheels, dayOptions, monthOptions, yearOptions]);
  
  return (
    <>
      {/* Compact Date Navigation */}
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        <button
          onClick={() => navigateDate('prev')}
          className="ios-touch-feedback p-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setShowDatePicker(true)}
          className="ios-touch-feedback flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent/50 transition-colors"
        >
          <span className="text-lg font-medium text-foreground">
            {formatDisplayDate(currentDate)}
          </span>
          <CalendarIcon className="h-4 w-4 text-foreground/50" />
        </button>
        
        <button
          onClick={() => navigateDate('next')}
          className="ios-touch-feedback p-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* iOS-Style Date Picker Modal */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="ios-card max-w-sm mx-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">Select Date</DialogTitle>
          </DialogHeader>
          
          {/* iOS-Style Scrollable Date Wheels */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Day Wheel */}
              <div className="space-y-2">
                <div className="text-foreground/60 text-xs font-medium">Day</div>
                <div 
                  ref={dayWheelRef}
                  className="h-40 overflow-y-scroll scrollbar-hide scroll-smooth"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                  onScroll={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="py-16"> {/* Padding for center alignment */}
                    {dayOptions.map((day) => (
                      <div
                        key={day}
                        onClick={() => handleDateWheelChange('day', day)}
                        className={`h-10 flex items-center justify-center cursor-pointer transition-all ${
                          day === dateWheels.day
                            ? 'text-foreground font-semibold text-lg'
                            : 'text-foreground/40 text-base hover:text-foreground/70'
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Month Wheel */}
              <div className="space-y-2">
                <div className="text-foreground/60 text-xs font-medium">Month</div>
                <div 
                  ref={monthWheelRef}
                  className="h-40 overflow-y-scroll scrollbar-hide scroll-smooth"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                  onScroll={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="py-16">
                    {monthOptions.map((month) => (
                      <div
                        key={month.value}
                        onClick={() => handleDateWheelChange('month', month.value)}
                        className={`h-10 flex items-center justify-center cursor-pointer transition-all ${
                          month.value === dateWheels.month
                            ? 'text-foreground font-semibold text-lg'
                            : 'text-foreground/40 text-base hover:text-foreground/70'
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                      >
                        {month.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Year Wheel */}
              <div className="space-y-2">
                <div className="text-foreground/60 text-xs font-medium">Year</div>
                <div 
                  ref={yearWheelRef}
                  className="h-40 overflow-y-scroll scrollbar-hide scroll-smooth"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                  onScroll={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="py-16">
                    {yearOptions.map((year) => (
                      <div
                        key={year}
                        onClick={() => handleDateWheelChange('year', year)}
                        className={`h-10 flex items-center justify-center cursor-pointer transition-all ${
                          year === dateWheels.year
                            ? 'text-foreground font-semibold text-lg'
                            : 'text-foreground/40 text-base hover:text-foreground/70'
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
            
            {/* Center Selection Lines */}
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="h-10 border-t border-b border-foreground/10 bg-accent/5"></div>
            </div>
            
            {/* Quick Navigation */}
            <div className="flex justify-center gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const todayWheels = generateDateWheels(today);
                  setDateWheels(todayWheels);
                  onDateChange(today.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDatePicker(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
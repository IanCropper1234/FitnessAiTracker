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
      
      {/* Modern Mobile Date Picker */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="max-w-sm mx-auto p-0 border-0 bg-transparent shadow-none">
          <div className="bg-background border border-border rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Select Date</h3>
                  <p className="text-white/80 text-sm">Choose your preferred date</p>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <CalendarIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-border">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const yesterday = new Date(selectedDate);
                    yesterday.setDate(yesterday.getDate() - 1);
                    onDateChange(yesterday.toISOString().split('T')[0]);
                    setShowDatePicker(false);
                  }}
                  className="p-3 bg-muted/50 hover:bg-muted rounded-xl text-center transition-all ios-touch-feedback"
                >
                  <div className="text-xs font-medium text-foreground/60">Yesterday</div>
                  <div className="text-sm font-semibold text-foreground">
                    {(() => {
                      const yesterday = new Date(selectedDate);
                      yesterday.setDate(yesterday.getDate() - 1);
                      return yesterday.getDate();
                    })()}
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const today = new Date();
                    onDateChange(today.toISOString().split('T')[0]);
                    setShowDatePicker(false);
                  }}
                  className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-center transition-all ios-touch-feedback"
                >
                  <div className="text-xs font-medium text-blue-600">Today</div>
                  <div className="text-sm font-bold text-blue-600">
                    {new Date().getDate()}
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const tomorrow = new Date(selectedDate);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    onDateChange(tomorrow.toISOString().split('T')[0]);
                    setShowDatePicker(false);
                  }}
                  className="p-3 bg-muted/50 hover:bg-muted rounded-xl text-center transition-all ios-touch-feedback"
                >
                  <div className="text-xs font-medium text-foreground/60">Tomorrow</div>
                  <div className="text-sm font-semibold text-foreground">
                    {(() => {
                      const tomorrow = new Date(selectedDate);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.getDate();
                    })()}
                  </div>
                </button>
              </div>
            </div>

            {/* Date Grid Selector */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Month/Year Header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      onDateChange(newDate.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors ios-touch-feedback"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      onDateChange(newDate.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors ios-touch-feedback"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Day Headers */}
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-center text-xs font-medium text-foreground/60 p-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {(() => {
                    const currentDate = new Date(selectedDate);
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const selectedDay = currentDate.getDate();
                    const today = new Date();
                    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
                    
                    const days = [];
                    
                    // Empty cells for days before the first day of the month
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} className="h-10"></div>);
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const isSelected = day === selectedDay;
                      const isToday = isCurrentMonth && day === today.getDate();
                      
                      days.push(
                        <button
                          key={day}
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(day);
                            onDateChange(newDate.toISOString().split('T')[0]);
                            setShowDatePicker(false);
                          }}
                          className={`h-10 w-10 rounded-xl text-sm font-medium transition-all ios-touch-feedback ${
                            isSelected
                              ? 'bg-blue-500 text-white shadow-lg scale-105'
                              : isToday
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-muted/20 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDatePicker(false)}
                className="text-foreground/60 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowDatePicker(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
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
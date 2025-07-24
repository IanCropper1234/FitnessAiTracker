import React, { useState } from 'react';
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
  
  // Generate day options (surrounding current day)
  const generateDayOptions = (month: number, year: number, selectedDay: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const options = [];
    
    // Show 2 days before and after selected day
    for (let i = Math.max(1, selectedDay - 2); i <= Math.min(daysInMonth, selectedDay + 2); i++) {
      options.push(i);
    }
    
    return options;
  };
  
  // Generate month options
  const generateMonthOptions = (selectedMonth: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const options = [];
    
    // Show 2 months before and after
    for (let i = Math.max(0, selectedMonth - 3); i <= Math.min(11, selectedMonth + 1); i++) {
      options.push({ value: i + 1, label: months[i] });
    }
    
    return options;
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
  
  const dayOptions = generateDayOptions(dateWheels.month, dateWheels.year, dateWheels.day);
  const monthOptions = generateMonthOptions(dateWheels.month - 1);
  
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
        <DialogContent className="ios-card max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">Select Date</DialogTitle>
          </DialogHeader>
          
          {/* Date Wheels */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Day Wheel */}
              <div className="space-y-3">
                <div className="text-foreground/60 text-sm font-medium">Day</div>
                <div className="space-y-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDateWheelChange('day', day)}
                      className={`w-full text-xl py-2 px-1 rounded-lg transition-all ${
                        day === dateWheels.day
                          ? 'bg-accent text-foreground font-semibold'
                          : 'text-foreground/60 hover:text-foreground hover:bg-accent/30'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Month Wheel */}
              <div className="space-y-3">
                <div className="text-foreground/60 text-sm font-medium">Month</div>
                <div className="space-y-2">
                  {monthOptions.map((month) => (
                    <button
                      key={month.value}
                      onClick={() => handleDateWheelChange('month', month.value)}
                      className={`w-full text-xl py-2 px-1 rounded-lg transition-all ${
                        month.value === dateWheels.month
                          ? 'bg-accent text-foreground font-semibold'
                          : 'text-foreground/60 hover:text-foreground hover:bg-accent/30'
                      }`}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Year Wheel */}
              <div className="space-y-3">
                <div className="text-foreground/60 text-sm font-medium">Year</div>
                <div className="space-y-2">
                  {[dateWheels.year - 1, dateWheels.year, dateWheels.year + 1].map((year) => (
                    <button
                      key={year}
                      onClick={() => handleDateWheelChange('year', year)}
                      className={`w-full text-xl py-2 px-1 rounded-lg transition-all ${
                        year === dateWheels.year
                          ? 'bg-accent text-foreground font-semibold'
                          : 'text-foreground/60 hover:text-foreground hover:bg-accent/30'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
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
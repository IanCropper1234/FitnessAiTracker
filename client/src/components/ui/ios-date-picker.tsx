import { useState } from "react";
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
    onDateChange(TimezoneUtils.getCurrentDate());
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-background w-full max-w-md mx-4 mb-4 rounded-t-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button
                onClick={() => setShowDatePicker(false)}
                className="ios-touch-feedback p-2 text-foreground/60 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold text-foreground">Change Date</h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="ios-touch-feedback p-2 text-blue-500 hover:text-blue-600"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>

            {/* Today Button */}
            <div className="p-4 text-center border-b border-border">
              <button
                onClick={handleTodaySelect}
                className="text-blue-500 font-medium text-lg hover:text-blue-600 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Date Picker Wheels */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-3">
                  <div className="text-foreground/60 text-sm font-medium">Day</div>
                  <div className="space-y-2">
                    {[22, 23, 24, 25, 26].map((day) => (
                      <div 
                        key={day}
                        className={`text-xl py-2 ${
                          day === 24 ? 'bg-accent text-foreground font-semibold rounded-lg' : 'text-foreground/60'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-foreground/60 text-sm font-medium">Month</div>
                  <div className="space-y-2">
                    {['May', 'June', 'July', 'August', 'September'].map((month) => (
                      <div 
                        key={month}
                        className={`text-xl py-2 ${
                          month === 'July' ? 'bg-accent text-foreground font-semibold rounded-lg' : 'text-foreground/60'
                        }`}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-foreground/60 text-sm font-medium">Year</div>
                  <div className="space-y-2">
                    {[2023, 2024, 2025, 2026, 2027].map((year) => (
                      <div 
                        key={year}
                        className={`text-xl py-2 ${
                          year === 2025 ? 'bg-accent text-foreground font-semibold rounded-lg' : 'text-foreground/60'
                        }`}
                      >
                        {year}
                      </div>
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
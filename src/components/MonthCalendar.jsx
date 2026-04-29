import { useState, useEffect } from "react";

// Helper: days in a given month
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper: day of week (0=Sun, 6=Sat) for the first day of a month
function firstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

// Helper: format month and year
function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

// Helper: convert date parts to ISO string
function toIso(year, month, day) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

// Helper: parse ISO string to { year, month, day }
function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

// Helper: check if a day is disabled
function isDisabled(year, month, day, min, max) {
  const iso = toIso(year, month, day);
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

// Helper: check if a day is today
function isToday(year, month, day) {
  const today = new Date();
  return (
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate()
  );
}

// Helper: check if a day is the selected day
function isSelected(year, month, day, value) {
  if (!value) return false;
  const { year: selYear, month: selMonth, day: selDay } = parseIso(value);
  return year === selYear && month === selMonth && day === selDay;
}

export function MonthCalendar({ value, onChange, max, min }) {
  // Initialize view month from value or today
  const initialMonth = value
    ? parseIso(value)
    : (() => {
        const today = new Date();
        return { year: today.getFullYear(), month: today.getMonth() };
      })();

  const [viewMonth, setViewMonth] = useState(initialMonth);

  // If value changes externally, update view month
  useEffect(() => {
    if (value) {
      const parsed = parseIso(value);
      setViewMonth(parsed);
    }
  }, [value]);

  const { year, month } = viewMonth;
  const daysCount = daysInMonth(year, month);
  const startingDayOfWeek = firstDayOfWeek(year, month);

  // Build calendar grid (always 6 rows = 42 cells for stable height)
  const cells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(null); // empty slot before month starts
  }
  for (let day = 1; day <= daysCount; day++) {
    cells.push(day);
  }
  while (cells.length < 42) {
    cells.push(null); // empty slots after month ends
  }

  const handlePrevMonth = () => {
    if (month === 0) {
      setViewMonth({ year: year - 1, month: 11 });
    } else {
      setViewMonth({ year, month: month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setViewMonth({ year: year + 1, month: 0 });
    } else {
      setViewMonth({ year, month: month + 1 });
    }
  };

  const handleDayClick = (day) => {
    if (!isDisabled(year, month, day, min, max)) {
      onChange(toIso(year, month, day));
    }
  };

  return (
    <div
      data-testid="month-calendar"
      style={{
        border: '1.5px solid #EAE4DA',
        borderRadius: 12,
        padding: 10,
        background: '#fff',
        width: 240,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Header with month/year and arrows */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 36,
          marginBottom: 8,
        }}
      >
        <button
          data-testid="calendar-prev"
          onClick={handlePrevMonth}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#F0EDE4')}
          onMouseLeave={(e) => (e.target.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 3L5 7l4 4"
              stroke="#4A6256"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          data-testid="calendar-month-label"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#1C2B22',
            textAlign: 'center',
            flex: 1,
          }}
        >
          {formatMonthYear(year, month)}
        </div>

        <button
          data-testid="calendar-next"
          onClick={handleNextMonth}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#F0EDE4')}
          onMouseLeave={(e) => (e.target.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 3l4 4-4 4"
              stroke="#4A6256"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          marginBottom: 6,
        }}
      >
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => (
          <div
            key={label}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#4A6256',
              textAlign: 'center',
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
        }}
      >
        {cells.map((day, idx) => {
          const disabled = day && isDisabled(year, month, day, min, max);
          const selected = day && isSelected(year, month, day, value);
          const today = day && isToday(year, month, day);

          return (
            <button
              key={idx}
              data-testid={day ? `calendar-day-${day}` : undefined}
              onClick={() => day && handleDayClick(day)}
              disabled={disabled}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: selected ? '#1A5C3A' : 'transparent',
                color: selected ? '#fff' : disabled ? '#C8C2B6' : '#1C2B22',
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled || !day ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                ...(today && !selected && {
                  border: '1.5px solid #1A5C3A',
                  boxSizing: 'border-box',
                }),
              }}
              onMouseEnter={(e) => {
                if (!disabled && day && !selected) {
                  e.target.style.background = '#E8F5EE';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && day && !selected) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

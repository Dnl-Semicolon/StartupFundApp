import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  onChange: (iso: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const pad = (n: number) => n.toString().padStart(2, '0');

const fmt = (d: Date) =>
  d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export function DateTimePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Pick date & time',
  className,
  disabled,
}: Props) {
  const selected = value ? new Date(value) : undefined;
  const [open, setOpen] = React.useState(false);

  const hh = selected ? pad(selected.getHours()) : '';
  const mm = selected ? pad(selected.getMinutes()) : '';

  const update = (d: Date) => {
    if (minDate && d < minDate) d = new Date(minDate);
    if (maxDate && d > maxDate) d = new Date(maxDate);
    onChange(d.toISOString());
  };

  const onPickDate = (d: Date | undefined) => {
    if (!d) return;
    const base = selected ?? new Date();
    const next = new Date(d);
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    if (!selected && minDate && next < minDate) {
      next.setHours(minDate.getHours(), minDate.getMinutes(), 0, 0);
    }
    update(next);
  };

  const onChangeTime = (which: 'h' | 'm', raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const base = selected ?? (minDate ? new Date(minDate) : new Date());
    const next = new Date(base);
    if (which === 'h') next.setHours(Math.max(0, Math.min(23, n)));
    else next.setMinutes(Math.max(0, Math.min(59, n)));
    next.setSeconds(0, 0);
    update(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? fmt(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onPickDate}
          disabled={(d) => {
            if (minDate) {
              const minDay = new Date(minDate); minDay.setHours(0,0,0,0);
              if (d < minDay) return true;
            }
            if (maxDate) {
              const maxDay = new Date(maxDate); maxDay.setHours(23,59,59,999);
              if (d > maxDay) return true;
            }
            return false;
          }}
          initialFocus
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time</span>
          <Input
            type="number"
            min={0}
            max={23}
            value={hh}
            placeholder="HH"
            className="h-8 w-16 text-center"
            onChange={(e) => onChangeTime('h', e.target.value)}
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            min={0}
            max={59}
            value={mm}
            placeholder="MM"
            className="h-8 w-16 text-center"
            onChange={(e) => onChangeTime('m', e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

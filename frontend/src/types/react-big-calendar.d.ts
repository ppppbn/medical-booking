declare module 'react-big-calendar' {
  export interface Event {
    id?: string | number;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
  }

  export interface View {
    MONTH: 'month';
    WEEK: 'week';
    DAY: 'day';
    AGENDA: 'agenda';
  }

  export const Views: View;

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    eventPropGetter?: (event: Event) => { style?: React.CSSProperties; className?: string };
    components?: {
      event?: React.ComponentType<any>;
      [key: string]: React.ComponentType<any> | undefined;
    };
    views?: (keyof View)[];
    defaultView?: keyof View;
    messages?: {
      [key: string]: string;
    };
    popup?: boolean;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: any) => void;
  }

  export class Calendar extends React.Component<CalendarProps> {}

  export function momentLocalizer(momentInstance: any): any;
}

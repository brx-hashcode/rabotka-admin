import { motion } from "framer-motion";

import {
  slideFromLeft,
  slideFromRight,
  transition,
} from "#/features/calendar/animations";
import { useCalendar } from "#/features/calendar/contexts/calendar-context";
import { DateNavigator } from "#/features/calendar/header/date-navigator";
import FilterEvents from "#/features/calendar/header/filter";
import { TodayButton } from "#/features/calendar/header/today-button";
import Views from "./view-tabs";

export function CalendarHeader() {
  const { view, events } = useCalendar();

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </motion.div>

      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <div className="options flex-wrap flex items-center gap-4 md:gap-2">
          <FilterEvents />
          <Views />
        </div>
      </motion.div>
    </div>
  );
}

import { formatDate } from "date-fns";
import { motion } from "framer-motion";
import { buttonHover, transition } from "#/features/calendar/animations";
import { useCalendar } from "#/features/calendar/contexts/calendar-context";

export function TodayButton() {
  const { setSelectedDate } = useCalendar();

  const today = new Date();
  const handleClick = () => setSelectedDate(today);

  return (
    <motion.div
      className="flex w-10 flex-col items-center overflow-hidden rounded-md border cursor-pointer select-none"
      onClick={handleClick}
      variants={buttonHover}
      whileHover="hover"
      whileTap="tap"
      transition={transition}
    >
      <motion.span
        className="w-full bg-primary py-0.5 text-center text-xs font-semibold text-primary-foreground leading-none"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, ...transition }}
      >
        {formatDate(today, "MMM").toUpperCase()}
      </motion.span>
      <motion.span
        className="py-1 text-sm font-bold leading-none"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, ...transition }}
      >
        {today.getDate()}
      </motion.span>
    </motion.div>
  );
}

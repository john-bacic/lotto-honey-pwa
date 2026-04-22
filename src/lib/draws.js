import { lottoMaxWinningNumbers2023 } from "../../data.js";

/** From this draw date onward (inclusive), honeycomb is always 52 numbers for Lotto Max. */
const LOTTO_MAX_HONEYCOMB_52_SINCE_MS = new Date("April 14, 2026").getTime();

export function getDrawRows() {
  return lottoMaxWinningNumbers2023.map((draw) => {
    const maxFromNums = Math.max(...draw.numbers, draw.bonus);
    const drawMs = new Date(draw.date).getTime();
    const onOrAfterApril14 =
      !Number.isNaN(drawMs) && drawMs >= LOTTO_MAX_HONEYCOMB_52_SINCE_MS;
    const maxNum = onOrAfterApril14 ? 52 : maxFromNums > 50 ? 52 : 50;
    return {
      date: draw.date,
      day: draw.day,
      nums: draw.numbers,
      bonus: draw.bonus,
      jackpot: draw.jackpot,
      maxNum
    };
  });
}

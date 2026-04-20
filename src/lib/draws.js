import { lottoMaxWinningNumbers2023 } from "../../data.js";

export function getDrawRows() {
  return lottoMaxWinningNumbers2023.map((draw) => {
    const maxNum = Math.max(...draw.numbers, draw.bonus);
    return {
      date: draw.date,
      day: draw.day,
      nums: draw.numbers,
      bonus: draw.bonus,
      jackpot: draw.jackpot,
      maxNum: maxNum > 50 ? 52 : 50
    };
  });
}

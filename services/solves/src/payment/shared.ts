import type { AIPrice } from "./types";

export const calculateCost = (
  price: AIPrice,
  useage: {
    input: number;
    output: number;
  },
) => {
  const inputCost = useage.input * Number(price.inputTokenPrice);
  const outputCost = useage.output * Number(price.outputTokenPrice);

  const inputMarketCost = inputCost * Number(price.markupRate);
  const outputMarketCost = outputCost * Number(price.markupRate);
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputMarketCost,
    outputMarketCost,
    totalMarketCost: inputMarketCost + outputMarketCost,
  };
};

/**
 * 숫자를 고정 소수점 문자열로 변환
 * @param value - 숫자
 * @param scale - 소수점 자리수 (기본 8)
 * @returns 문자열 (예: "123.45678900")
 */
export const toDecimal = (value: number, scale: number = 8): string => {
  return value.toFixed(scale);
};

export const displayCost = (cost: number) => {
  const weight = 1500; // 대략적인 환율!
  return cost * weight;
};

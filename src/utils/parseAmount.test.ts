import { parseAmount } from './parseAmount';

describe('parseAmount', () => {
  it('parses a plain number', () => {
    expect(parseAmount('500')).toBe(500);
  });

  it('parses comma-grouped thousands', () => {
    expect(parseAmount('1,000')).toBe(1000);
    expect(parseAmount('1,000,000')).toBe(1000000);
  });

  it('parses space-grouped thousands', () => {
    expect(parseAmount('1 000')).toBe(1000);
  });

  it('trims surrounding whitespace', () => {
    expect(parseAmount('  250  ')).toBe(250);
  });

  it('parses decimals correctly alongside commas', () => {
    expect(parseAmount('1,250.50')).toBe(1250.5);
  });

  it('rejects empty input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(parseAmount('abc')).toBeNull();
  });

  it('rejects zero and negative values', () => {
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-50')).toBeNull();
  });
});
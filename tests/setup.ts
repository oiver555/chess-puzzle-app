/* eslint @typescript-eslint/no-require-imports: off -- Load the official mock inside Jest's hoisted factory. */
import { jest } from '@jest/globals';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

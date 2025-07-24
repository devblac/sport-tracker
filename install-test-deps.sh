#!/bin/bash

# Install testing dependencies
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom

echo "Testing dependencies installed!"
echo "You can now run tests with: npm run test"
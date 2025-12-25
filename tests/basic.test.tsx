import { render } from "@testing-library/react";
import App from '../src/App';
import { describe, it } from 'vitest';

describe('Basic functionality', () => {
  it('should render the app', () => {
    render(<App/>);
  });
})
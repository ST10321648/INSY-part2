import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders without crashing", () => {
  render(<App />);
  // Just check something simple exists
  const linkElement = screen.getByText(/customer login/i);
  expect(linkElement).toBeInTheDocument();
});


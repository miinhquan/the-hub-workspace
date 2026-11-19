// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TourCards } from "../src/components/TourCards";
import { defaults } from "../src/config";

afterEach(cleanup);

it("keeps each enlarged photo through other selections, filtering and a return to the orbit", async () => {
  const props = {
    children: <div aria-label="Conversation orb" />,
    visible: true,
    config: defaults.cards,
    destination: "all",
    onBack: vi.fn(),
    onDetails: vi.fn(),
    onInquiry: vi.fn(),
    reduced: true,
    speed: 1,
    detailRequest: 0,
  };
  const screenView = render(<TourCards {...props} />);
  const photo = (place: string) =>
    screen.findByRole("button", { name: `Enlarge ${place} photo` });
  fireEvent.click(await photo("Ninh Binh"));
  fireEvent.click(await photo("Ha Giang"));
  fireEvent.click(await photo("Ha Giang"));
  expect((await photo("Ninh Binh")).getAttribute("aria-pressed")).toBe("true");
  expect((await photo("Ha Long Bay")).getAttribute("aria-pressed")).toBe(
    "false",
  );
  expect(props.onDetails).not.toHaveBeenCalled();

  screenView.rerender(<TourCards {...props} visible={false} />);
  screenView.rerender(<TourCards {...props} destination="hagiang" />);
  expect((await photo("Ha Giang")).getAttribute("aria-pressed")).toBe("true");
  expect(
    screen.queryByRole("button", { name: "Enlarge Ninh Binh photo" }),
  ).toBeNull();
  screenView.rerender(<TourCards {...props} />);
  expect((await photo("Ninh Binh")).getAttribute("aria-pressed")).toBe("true");

  screenView.unmount();
  render(<TourCards {...props} />);
  expect((await photo("Ha Giang")).getAttribute("aria-pressed")).toBe("false");
});

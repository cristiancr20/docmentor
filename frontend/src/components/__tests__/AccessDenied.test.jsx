import React from "react";
import { render, screen } from "@testing-library/react";
import AccessDenied, { ACCESS_DENIED_MESSAGE } from "../AccessDenied";

describe("AccessDenied", () => {
  it("muestra el mensaje de acceso denegado consistente por defecto", () => {
    render(<AccessDenied />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(screen.getByText(ACCESS_DENIED_MESSAGE)).toBeInTheDocument();
  });

  it("permite personalizar el mensaje manteniendo el titulo", () => {
    render(<AccessDenied message="No puedes ver los registros de auditoría." />);

    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(
      screen.getByText("No puedes ver los registros de auditoría.")
    ).toBeInTheDocument();
  });
});

import { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { BlockDefaultProps } from "./types";

type Props = BlockDefaultProps & ComponentProps<"div">;

export function Block({}: Props) {
  return <Card></Card>;
}

type BlockProps =
  | {
      mode: "edit";
      block: any;
    }
  | {
      mode: "solve";
      block: any;
    };

export function Block({}: BlockProps) {}

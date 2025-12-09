import { IS_PROD } from "@workspace/util/const";
import { createConsola, LogLevels } from "consola";
import { ColorName, colorize } from "consola/utils";

const defaultLog = createConsola({
  level: IS_PROD ? LogLevels.info : LogLevels.debug,
});

export const createLogger = (name: string, color?: ColorName) =>
  defaultLog.withDefaults({
    message: colorize(color || "blackBright", `${name}: `),
  });

export const logger = createLogger("dashboard");

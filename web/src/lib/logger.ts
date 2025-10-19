import pino from "pino";

// Configuración de Pino que funciona tanto en servidor como en cliente
const logger =
  typeof window === "undefined"
    ? // Servidor: usar pino con pretty print
      pino({
        transport:
          process.env.NODE_ENV === "development"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
                },
              }
            : undefined,
        level: process.env.NODE_ENV === "development" ? "debug" : "info",
      })
    : // Cliente (navegador): usar pino básico sin transport
      pino({
        browser: {
          asObject: false,
          serialize: true,
          write: (o) => {
            const level = (o as { level?: number }).level;
            const msg = (o as { msg?: string }).msg || "";
            // Extraer propiedades personalizadas (excluir las de pino)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { level: _l, time: _t, msg: _m, ...custom } = o as Record<
              string,
              unknown
            >;

            if (level === 30) {
              // info
              console.log(`[INFO] ${msg}`, custom);
            } else if (level === 50) {
              // error
              console.error(`[ERROR] ${msg}`, custom);
            } else if (level === 40) {
              // warn
              console.warn(`[WARN] ${msg}`, custom);
            } else if (level === 20) {
              // debug
              console.debug(`[DEBUG] ${msg}`, custom);
            } else {
              console.log(`[LOG] ${msg}`, custom);
            }
          },
        },
        level: process.env.NODE_ENV === "development" ? "debug" : "info",
      });

export default logger;

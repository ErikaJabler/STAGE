import { Hono } from "hono";
import type { Env, AuthVariables } from "../bindings";
import { ImageService, ImageValidationError } from "../services/image.service";

const images = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** POST /api/images — Upload an image to R2 (authenticated) */
images.post("/", async (c) => {
  if (!c.env.IMAGES) {
    return c.json({ error: "Bildlagring (R2) är inte konfigurerad" }, 503);
  }

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "Bildfil krävs (form field 'file')" }, 400);
  }

  try {
    const result = await ImageService.upload(c.env.IMAGES, file);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof ImageValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

/** GET /api/images/:prefix/:filename — Serve an image from R2 */
images.get("/:prefix/:filename", async (c) => {
  if (!c.env.IMAGES) {
    return c.json({ error: "Bildlagring (R2) är inte konfigurerad" }, 503);
  }

  const key = `${c.req.param("prefix")}/${c.req.param("filename")}`;
  const object = await ImageService.get(c.env.IMAGES, key);

  if (!object) {
    return c.json({ error: "Bilden hittades inte" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

export default images;
